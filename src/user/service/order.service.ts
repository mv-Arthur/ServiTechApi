import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Order } from "../model/order.model";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "../model/user.model";
import { File } from "../model/file.model";
import { Status } from "../model/status.model";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { rename } from "fs";
import { AddOrderDto } from "../dto/addOrder.dto";
import { StatusType } from "../types/StatusType";
import { Type } from "../model/type.model";
import { OrderDto } from "../dto/order.dto";
import * as webPush from "web-push";
import { Vapid } from "../model/vapid.model";

import { Subscription } from "../model/subscription.model";
import { Keys } from "../model/keys.model";
import {
  CreateSettingsDto,
  CreateTypeDto,
  CreationTypeDto,
  TypeDto,
} from "../dto/createType.dto";
import { Personal } from "../model/personal.model";
import { PersonalDto } from "../dto/personalCreation.dto";
import { Report } from "../model/report.model";
import { DateU } from "../model/dateU.model";
import { Sequelize } from "sequelize-typescript";
import { AttachTypeDto } from "../dto/attachType.dto";

import { OperatorSettings } from "../model/operatorSettings.model";
import { SettingsDto, UserDtoForOperator } from "../dto/user.dto";
import { Chat } from "../model/chatItem.model";
import { OperatorReport } from "../model/operatorReport.model";
import { where } from "sequelize";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order) private orderRepository: typeof Order,
    @InjectModel(User) private userRepository: typeof User,
    @InjectModel(File) private fileRepository: typeof File,
    @InjectModel(Status) private statusRepository: typeof Status,
    @InjectModel(Type) private typeRepository: typeof Type,
    @InjectModel(Report) private reportRepository: typeof Report,
    @InjectModel(DateU) private dateURepository: typeof DateU,
    @InjectModel(OperatorReport)
    private operatorReportRepository: typeof OperatorReport,
    @InjectModel(OperatorSettings)
    private operatorSettingsRepository: typeof OperatorSettings,
    @InjectModel(Chat) private chatRepository: typeof Chat,
    private readonly sequelize: Sequelize
  ) {}

  getExtension(filename: string) {
    const match = /\.([0-9a-z]+)$/i.exec(filename);
    return match ? match[1].toLowerCase() : false;
  }

  async addOrder(userId: number, file: Express.Multer.File, dto: AddOrderDto) {
    const { description, type } = dto;

    const typeDB = await this.typeRepository.findOne({
      where: { type },
    });

    if (!typeDB) {
      throw new HttpException("неизвестный тип", HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException("пользователь не найден", HttpStatus.BAD_REQUEST);
    }

    const extention = this.getExtension(file.originalname);
    const filePath = join(
      __dirname,
      "..",
      "uploads",
      uuidv4() + `.${extention}`
    );
    console.log("путь", filePath);
    if (extention) {
      rename(file.path, filePath, (err) => {
        if (err) {
          console.error(err);
          throw new HttpException(
            "ошибка при чтении файла",
            HttpStatus.BAD_REQUEST
          );
        }
        console.log(`переименован успешно`);
      });
    }
    const order = await this.orderRepository.create({ description, userId });
    const fileDB = await this.fileRepository.create({
      path: filePath,
      type,
      orderId: order.id,
    });
    const status = await this.statusRepository.create({ orderId: order.id });
    const allTypes = await this.typeRepository.findAll();
    const types = allTypes.find((type) => type.type === fileDB.type);
    order.price = types.minPrice;
    await order.save();
    const admins = await this.userRepository.findAll({
      where: {
        role: "admin",
      },
      include: [
        Vapid,
        {
          model: Subscription,
          include: [Keys],
        },
      ],
    });

    if (!admins.length)
      throw new HttpException(
        "нет найденных аккаунтов админа",
        HttpStatus.BAD_REQUEST
      );

    try {
      for (const admin of admins) {
        const VAPID = {
          publicKey: admin.vapid.publicKey,
          privateKey: admin.vapid.privateKey,
        };

        webPush.setVapidDetails(
          "mailto:example@yourdomain.org",
          VAPID.publicKey,
          VAPID.privateKey
        );

        await webPush.sendNotification(
          {
            endpoint: admin.subscription.endpoint,

            keys: {
              p256dh: admin.subscription.keys.p256dh,
              auth: admin.subscription.keys.auth,
            },
          },
          JSON.stringify({
            title: `новый заказ от ${user.email}`,
            descr: `перейдите в личный кабинет и обновите страничку: ${order.description}`,
          })
        );
      }
    } catch (err) {}

    return new OrderDto(order, status, fileDB, types);
  }

  async getAlluser() {
    return await this.userRepository.findAll({
      where: {
        role: "admin",
      },
      include: [
        Vapid,
        {
          model: Subscription,
          include: [Keys],
        },
      ],
    });
  }

  async setPrice(id: number, price: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order)
      throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);

    order.price = price;
    order.save();
  }

  async setStatus(id: number, status: StatusType) {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order)
      throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);

    const user = await this.userRepository.findOne({
      where: {
        id: order.userId,
      },
      include: [
        Vapid,
        {
          model: Subscription,
          include: [Keys],
        },
      ],
    });

    if (!user)
      throw new HttpException("пользовтель не найден", HttpStatus.BAD_REQUEST);

    const statusDb = await this.statusRepository.findOne({
      where: {
        orderId: order.id,
      },
    });

    if (!statusDb)
      throw new HttpException("статус не найден", HttpStatus.BAD_REQUEST);

    let message = null;

    if (status === "pending") {
      message = "ожидает принятия";
    }

    if (status === "job") {
      message = "в работе";
    }

    if (status === "resolved") {
      message = "готово к выдаче";
    }

    if (status === "rejected") {
      message = "отклонено";
    }

    if (!message) {
      message = "ожидает принятия";
    }

    statusDb.status = status;
    statusDb.message = message;

    statusDb.save();

    const VAPID = {
      publicKey: user.vapid.publicKey,
      privateKey: user.vapid.privateKey,
    };

    try {
      webPush.setVapidDetails(
        "mailto:example@yourdomain.org",
        VAPID.publicKey,
        VAPID.privateKey
      );

      await webPush.sendNotification(
        {
          endpoint: user.subscription.endpoint,
          keys: {
            p256dh: user.subscription.keys.p256dh,
            auth: user.subscription.keys.auth,
          },
        },
        JSON.stringify({
          title: `статус заказа: ${order.description} был изменен на "${statusDb.message}"`,
          descr: `перейдите в личный кабинет и обновите страничку`,
        })
      );
    } catch (err) {}
  }

  async updateDescription(id: number, description: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order)
      throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);
    order.description = description;
    order.save();
  }

  async createType(dto: CreateTypeDto, file: Express.Multer.File) {
    const { type, name, description, minPrice } = dto;
    const typeDb = await this.typeRepository.findOne({ where: { type } });

    if (typeDb) {
      throw new HttpException("такой тип уже имеется", HttpStatus.BAD_REQUEST);
    }

    const extention = this.getExtension(file.originalname);

    const fileName = uuidv4() + `.${extention}`;

    const filePath = join(__dirname, "..", "uploads", fileName);
    if (extention) {
      rename(file.path, filePath, (err) => {
        if (err) {
          console.error(err);
          throw new HttpException(
            "ошибка при чтении файла",
            HttpStatus.BAD_REQUEST
          );
        }
        console.log(`переименован успешно`);
      });
    }

    const newType = await this.typeRepository.create({
      name,
      type,
      fileName,
      description,
      minPrice,
    });

    return newType;
  }

  async download(id: number) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order)
      throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);
    const file = await this.fileRepository.findOne({
      where: { orderId: order.id },
    });
    if (!file)
      throw new HttpException("файл не найден", HttpStatus.BAD_REQUEST);
    return file.path;
  }

  async getAllType() {
    const types = await this.typeRepository.findAll();
    return types;
  }

  async deleteType(id: number) {
    const type = await this.typeRepository.findOne({ where: { id } });
    if (!type)
      throw new HttpException("типы не найдены", HttpStatus.BAD_REQUEST);
    await this.unattachType(type.id);
    const delCount = await this.typeRepository.destroy({
      where: { id: type.id },
    });

    const orders = await this.orderRepository.findAll({ include: [File] });
    await Promise.all(
      orders.map((order) => {
        if (order.file.type === type.type) {
          order.destroy();
        }
      })
    );

    if (!delCount) {
      throw new HttpException("типы не найдены", HttpStatus.BAD_REQUEST);
    }

    return {
      message: "успешно удален",
      deletedTypeId: type.id,
    };
  }

  async getOrderById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user)
      throw new HttpException("пользователь не найден", HttpStatus.BAD_REQUEST);
    const orders = await this.orderRepository.findAll({
      where: { userId: user.id },
      include: { all: true },
    });

    if (!orders)
      throw new HttpException("заявки не найдены", HttpStatus.BAD_REQUEST);
    const types = await this.typeRepository.findAll();
    if (!types)
      throw new HttpException("типы не найдены", HttpStatus.BAD_REQUEST);

    const filtered = orders.filter((order) => {
      return !order.archived;
    });

    return filtered.map((order) => {
      const status = order.status;
      const file = order.file;
      const type = types.find((type) => type.type === file.type);
      if (type) {
        const orderDto = new OrderDto(order, status, file, type);
        return {
          ...orderDto,
        };
      }
      return null;
    });
  }

  async getAllOrder() {
    const users = await this.userRepository.findAll({
      include: [
        Personal,
        {
          model: Order,
          include: [Status, File],
        },
        OperatorSettings,
      ],
    });

    const types = await this.typeRepository.findAll();

    return users.map((user) => {
      const { order } = user;

      return {
        id: user.id,
        typeId: user.typeId,
        email: user.email,
        role: user.role,
        operatorSettings: user.operatorSettings,
        personal: new PersonalDto(user.personal),
        order: order.map((order) => {
          const { status, file } = order;
          const foundedType = types.find((type) => type.type === file.type);
          if (!foundedType)
            return {
              id: order.id,
              description: null,
              price: null,
              status: null,
              message: null,
              file: null,
              type: null,
              name: null,
            };
          const orderDto = new OrderDto(order, status, file, foundedType);
          return {
            ...orderDto,
          };
        }),
      };
    });
  }

  async getAllByAcc() {
    const users = await this.userRepository.findAll({
      include: [{ model: Order, include: [Status, File] }, Personal],
    });
    const types = await this.typeRepository.findAll();
    const res = [];
    const mapped = users.map((user) => {
      if (user.role === "admin" || user.role === "accounting") return;

      return user.order.map((order) => {
        const founded = types.find((type) => type.type === order.file.type);
        return {
          orderId: order.id,
          name: user.personal.name,
          surname: user.personal.surname,
          patronymic: user.personal.patronymic,
          phoneNumber: user.personal.phoneNumber,
          orderType: founded.name,
          orderPrice: order.price,
          userEmail: user.email,
          orderDescription: order.description,
          status: order.status.status,
        };
      });
    });
    const filtered = mapped.filter((el) => !!el);

    filtered.forEach((el) => {
      res.push(...el);
    });

    const ordersToDelete = await this.orderRepository.findAll({
      include: [
        {
          model: Status,
          where: {
            status: ["resolved", "rejected"],
          },
        },
      ],
    });

    for (const order of ordersToDelete) {
      await order.destroy();
    }

    return res.filter(
      (el) => el.status === "resolved" || el.status === "rejected"
    );
  }

  getDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const currentDate = `${day}-${month}-${year}`;
    return currentDate;
  }

  async setReport() {
    let rejQty = 0;
    let fullfiledQty = 0;
    let rev = 0;
    const orders = await this.getAllByAcc();
    console.log(orders);
    const dateU = await this.dateURepository.create({
      revenue: "",
      date: this.getDate(),
      rejectedQty: "",
      fullfiledQty: "",
    });

    const mapped = orders.map((order) => {
      return { ...order, dateUId: dateU.id };
    });

    const reports = await this.reportRepository.bulkCreate(mapped);
    for (let i = 0; i < reports.length; i++) {
      if (reports[i].status === "rejected") {
        rejQty += 1;
      }
      if (reports[i].status === "resolved") {
        fullfiledQty += 1;
        rev += Number(reports[i].orderPrice);
      }
    }
    dateU.revenue = String(rev);
    dateU.rejectedQty = String(rejQty);
    dateU.fullfiledQty = String(fullfiledQty);
    await dateU.save();

    return {
      message: "Успех",
    };
  }

  async getRevenue() {
    const rev = await this.dateURepository.findAll({ include: { all: true } });
    return rev;
  }

  async acttachType(dto: AttachTypeDto) {
    const { userId, typeId } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user)
      throw new HttpException("пользователь не найден", HttpStatus.BAD_REQUEST);

    const type = await this.typeRepository.findOne({
      where: { id: typeId },
      include: { model: User },
    });

    if (!type) throw new HttpException("тип не найден", HttpStatus.BAD_REQUEST);

    if (type.operator && type.operator.id) {
      throw new HttpException(
        "оператор уже закреплен за этим типом",
        HttpStatus.BAD_REQUEST
      );
    }

    if (user.typeId) {
      const attachedType = await this.typeRepository.findOne({
        where: { id: user.typeId },
      });
      throw new HttpException(
        `оператор закреплен за другим типом: ${attachedType.name}`,
        HttpStatus.BAD_REQUEST
      );
    }

    user.typeId = type.id;
    type.operator = user;
    await user.save();
    await type.save();

    return {
      typeId: type.id,
      userId: user.id,
    };
  }

  async unattachType(id: number) {
    const type = await this.typeRepository.findOne({
      where: { id },
      include: { model: User },
    });
    // console.log(type);
    if (!type) throw new HttpException("тип не найден", HttpStatus.BAD_REQUEST);

    const user = await this.userRepository.findOne({
      where: { id: type.operator.id },
    });

    if (!user)
      throw new HttpException("оператор не найден", HttpStatus.BAD_REQUEST);

    type.operator = null;
    await type.save();

    user.typeId = null;
    await user.save();

    return {
      message: "оператор успешно откреплен",
      id: type.id,
    };
  }

  async updateType(id: number, dto: TypeDto) {
    const type = await this.typeRepository.findOne({ where: { id } });

    if (!type) throw new HttpException("тип не найден", HttpStatus.BAD_REQUEST);
    await type.update({ ...dto });

    const requestedData = new CreationTypeDto(type);

    return { message: "данные успешно обновлены", id: type.id, requestedData };
  }

  async updateTypePicture(id: number, file: Express.Multer.File) {
    const extention = this.getExtension(file.originalname);

    const fileName = uuidv4() + `.${extention}`;

    const filePath = join(__dirname, "..", "uploads", fileName);
    if (extention) {
      rename(file.path, filePath, (err) => {
        if (err) {
          console.error(err);
          throw new HttpException(
            "ошибка при чтении файла",
            HttpStatus.BAD_REQUEST
          );
        }
        console.log(`переименован успешно`);
      });
    }

    const type = await this.typeRepository.findOne({ where: { id } });

    type.fileName = fileName;
    await type.save();

    return {
      message: "изображение успешно изменено",
      id: type.id,
      fileName,
    };
  }

  //require userId in param "id"
  async setTypesSetting(dto: CreateSettingsDto) {
    const operator = await this.userRepository.findOne({
      where: { id: dto.userId },
      include: [OperatorSettings],
    });

    if (operator.operatorSettings)
      throw new HttpException("настройки уже заложены", HttpStatus.BAD_REQUEST);

    if (!operator) throw new HttpException("не найден", HttpStatus.BAD_REQUEST);

    if (operator.role !== "operator")
      throw new HttpException(
        "пользователь не подходящий роли",
        HttpStatus.BAD_REQUEST
      );

    const operatorSettings = await this.operatorSettingsRepository.create(dto);

    return {
      message: "Настройки успешно добавлены",
      operatorSettings,
    };
  }

  async updateTyepsSettings(dto: CreateSettingsDto) {
    const operator = await this.userRepository.findOne({
      where: { id: dto.userId },
      include: [OperatorSettings],
    });
    if (!operator)
      throw new HttpException("оператор не найден", HttpStatus.BAD_REQUEST);

    if (!operator.operatorSettings)
      throw new HttpException("настройки не заложены", HttpStatus.BAD_REQUEST);

    await operator.operatorSettings.update({ ...dto });
    await operator.operatorSettings.save();

    return {
      message: "настройки успешно обновлены",
      operatorSettings: operator.operatorSettings,
    };
  }

  async getOrdersForOperator(userId: number, role: "operator" | "user") {
    if (role === "operator") {
      const operator = await this.userRepository.findOne({
        where: { id: userId },
        include: [Personal, OperatorSettings],
      });
      if (!operator)
        throw new HttpException("оператор не найден", HttpStatus.BAD_REQUEST);
      const type = await this.typeRepository.findOne({
        where: { id: operator.typeId },
      });
      if (!type)
        throw new HttpException(
          "тип не закреплен за оператором",
          HttpStatus.BAD_REQUEST
        );

      const orders = await this.orderRepository.findAll({
        include: [File, Status, Chat],
      });

      const filteredOrdersByType = orders.filter((order) => {
        return order.file.type === type.type && !order.archived;
      });

      const ordersWithType = await Promise.all(
        filteredOrdersByType.map(async (order) => {
          const type = await this.typeRepository.findOne({
            where: { type: order.file.type },
          });
          const customer = await this.userRepository.findOne({
            where: { id: order.userId },
            include: [Personal],
          });
          return {
            order: order,
            file: order.file,
            type: type,
            status: order.status,
            customer,
            chat: order.chat,
          };
        })
      );

      const ordersForResponse = ordersWithType.map((order) => {
        return {
          operator: new UserDtoForOperator(operator, operator.personal),
          customer: new UserDtoForOperator(
            order.customer,
            order.customer.personal
          ),
          ...new OrderDto(order.order, order.status, order.file, order.type),
          chat: order.chat,
          operatorSettings: new SettingsDto(operator.operatorSettings),
        };
      });

      return ordersForResponse;
    }

    if (role === "user") {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        include: [Personal],
      });

      const ordersForUser = await this.orderRepository.findAll({
        where: { userId: user.id },
        include: [File, Status, Chat],
      });

      const filtered = ordersForUser.filter((order) => {
        return !order.archived;
      });

      const ordersForResponse = await Promise.all(
        filtered.map(async (order) => {
          const orderType = await this.typeRepository.findOne({
            where: { type: order.file.type },
          });
          const operator = await this.userRepository.findOne({
            where: { typeId: orderType.id },
            include: [Personal, OperatorSettings],
          });

          return {
            operator: new UserDtoForOperator(operator, operator.personal),
            customer: new UserDtoForOperator(user, user.personal),
            ...new OrderDto(order, order.status, order.file, orderType),
            chat: order.chat,
            operatorSettings: new SettingsDto(operator.operatorSettings),
          };
        })
      );

      return ordersForResponse;
    }
  }

  async sendOperatorReport(operatorId: number) {
    const operator = await this.userRepository.findOne({
      where: { id: operatorId },
    });

    const operatorSettings = await this.operatorSettingsRepository.findOne({
      where: {
        userId: operator.id,
      },
    });

    const attachedType = await this.typeRepository.findOne({
      where: { id: operator.typeId },
    });
    const orders = await this.orderRepository.findAll({
      include: [File, Status],
    });

    const operatorReport = await this.operatorReportRepository.create({
      operatorId: operator.id,
      date: this.getDate(),
      totalEarnings: operatorSettings.totalEarnings,
    });

    const filteredOrders = orders.filter((order) => {
      if (
        order.file.type === attachedType.type &&
        (order.status.status === "resolved" ||
          order.status.status === "rejected") &&
        !order.archived
      ) {
        return true;
      }
    });

    if (!filteredOrders.length)
      throw new HttpException(
        "Нет отклонненых или выполненных заявок",
        HttpStatus.BAD_REQUEST
      );

    Promise.all(
      filteredOrders.map(async (order) => {
        order.operatorReportId = operatorReport.id;
        order.archived = true;
        order.date = this.getDate();
        await order.save();
      })
    );
    operatorSettings.totalEarnings = 0;
    await operatorSettings.save();
    return {
      message: "Успех",
    };
  }

  //   async getReport(operatorId: number) {
  //     const operator = await this.userRepository.findOne({
  //       where: { id: operatorId },
  //     });
  //     const attachedType = await this.typeRepository.findOne({
  //       where: { id: operator.typeId },
  //     });
  //     const orders = await this.orderRepository.findAll({
  //       include: [File, Status],
  //     });
  //     const ordersForFilter = await Promise.all(
  //       orders.map(async (order) => {
  //         const customer = await this.userRepository.findOne({
  //           where: { id: order.userId },
  //           include: [Personal],
  //         });
  //         return {
  //           customer: new UserDtoForOperator(customer, customer.personal),
  //           ...new OrderDto(order, order.status, order.file, attachedType),
  //           archived: order.archived,
  //           date: order.date,
  //         };
  //       })
  //     );
  //     const filteredOrders = ordersForFilter.filter((order) => {
  //       if (order.type === attachedType.type && order.archived) {
  //         return true;
  //       }
  //     });

  //     return filteredOrders;
  //   }

  async getAllReports() {
    const operatorsReports = await this.operatorReportRepository.findAll({
      include: [{ model: Order, include: [Status, File] }],
    });

    const response = await Promise.all(
      operatorsReports.map(async (report) => {
        const operator = await this.userRepository.findOne({
          where: { id: report.operatorId },
          include: [Personal, OperatorSettings],
        });

        return {
          id: report.id,
          totalEarnings: report.totalEarnings,
          operator: new UserDtoForOperator(operator, operator.personal),
          date: report.date,
          orders: await Promise.all(
            report.order.map(async (order) => {
              const type = await this.typeRepository.findOne({
                where: { type: order.file.type },
              });

              const customer = await this.userRepository.findOne({
                where: { id: order.userId },
                include: [Personal],
              });

              return {
                order: {
                  ...new OrderDto(order, order.status, order.file, type),
                },
                customer: new UserDtoForOperator(customer, customer.personal),
              };
            })
          ),
        };
      })
    );

    return response;
  }
}
