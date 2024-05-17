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
import { CreateTypeDto } from "../dto/createType.dto";
import { Personal } from "../model/personal.model";
import { PersonalDto } from "../dto/personalCreation.dto";
import { Report } from "../model/report.model";
import { DateU } from "../model/dateU.model";
import { Sequelize } from "sequelize-typescript";
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
		const filePath = join(__dirname, "..", "uploads", uuidv4() + `.${extention}`);
		console.log("путь", filePath);
		if (extention) {
			rename(file.path, filePath, (err) => {
				if (err) {
					console.error(err);
					throw new HttpException("ошибка при чтении файла", HttpStatus.BAD_REQUEST);
				}
				console.log(`переименован успешно`);
			});
		}
		const order = await this.orderRepository.create({ description, userId });
		const fileDB = await this.fileRepository.create({ path: filePath, type, orderId: order.id });
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
			throw new HttpException("нет найденных аккаунтов админа", HttpStatus.BAD_REQUEST);

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

		if (!order) throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);

		order.price = price;
		order.save();
	}

	async setStatus(id: number, status: StatusType) {
		const order = await this.orderRepository.findOne({ where: { id } });

		if (!order) throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);

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

		if (!user) throw new HttpException("пользовтель не найден", HttpStatus.BAD_REQUEST);

		const statusDb = await this.statusRepository.findOne({
			where: {
				orderId: order.id,
			},
		});

		if (!statusDb) throw new HttpException("статус не найден", HttpStatus.BAD_REQUEST);

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
		if (!order) throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);
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
					throw new HttpException("ошибка при чтении файла", HttpStatus.BAD_REQUEST);
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
		if (!order) throw new HttpException("запись не найдена", HttpStatus.BAD_REQUEST);
		const file = await this.fileRepository.findOne({ where: { orderId: order.id } });
		if (!file) throw new HttpException("файл не найден", HttpStatus.BAD_REQUEST);
		return file.path;
	}

	async getAllType() {
		const types = await this.typeRepository.findAll();
		return types;
	}

	async deleteType(id: number) {
		const type = await this.typeRepository.findOne({ where: { id } });
		if (!type) throw new HttpException("типы не найдены", HttpStatus.BAD_REQUEST);
		const delCount = await this.typeRepository.destroy({ where: { id: type.id } });
		if (!delCount) {
			throw new HttpException("типы не найдены", HttpStatus.BAD_REQUEST);
		}
		return {
			deletedTypeId: type.id,
		};
	}

	async getOrderById(id: number) {
		const user = await this.userRepository.findOne({ where: { id } });
		if (!user) throw new HttpException("пользователь не найден", HttpStatus.BAD_REQUEST);
		const orders = await this.orderRepository.findAll({
			where: { userId: user.id },
			include: { all: true },
		});

		if (!orders) throw new HttpException("заявки не найдены", HttpStatus.BAD_REQUEST);
		const types = await this.typeRepository.findAll();
		if (!types) throw new HttpException("типы не найдены", HttpStatus.BAD_REQUEST);

		return orders.map((order) => {
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
			],
		});

		const types = await this.typeRepository.findAll();

		return users.map((user) => {
			const { order } = user;

			return {
				id: user.id,
				email: user.email,
				role: user.role,
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

		return res.filter((el) => el.status === "resolved" || el.status === "rejected");
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
}
