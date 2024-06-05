import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { TokenService } from "../service/token.service";
import { StatusType } from "../types/StatusType";
import { InjectModel } from "@nestjs/sequelize";
import { Order } from "../model/order.model";
import { Status } from "../model/status.model";
import { User } from "../model/user.model";
import { File } from "../model/file.model";
import { Type } from "../model/type.model";
import { RoleType } from "../types/RoleType";
import { Chat } from "../model/chatItem.model";
import { OperatorSettings } from "../model/operatorSettings.model";
@WebSocketGateway({
	cors: {
		origin: "*",
	},
})
export class SoketService implements OnGatewayConnection {
	@WebSocketServer()
	server: Server;
	constructor(
		private readonly tokenService: TokenService,
		@InjectModel(Order) private orderRepository: typeof Order,
		@InjectModel(Status) private statusRepository: typeof Status,
		@InjectModel(User) private userRepository: typeof User,
		@InjectModel(Chat) private chatRepository: typeof Chat,
		@InjectModel(Type) private typeRepository: typeof Type,
		@InjectModel(OperatorSettings) private operatorSettingsRepository: typeof OperatorSettings
	) {}

	private clients: { [id: string]: Socket } = {};

	@SubscribeMessage("set_status")
	async handleSetStatus(
		@ConnectedSocket() socket: Socket,
		@MessageBody() payload: { orderId: number; status: StatusType }
	) {
		const order = await this.orderRepository.findOne({
			where: { id: payload.orderId },
			include: [Status, File],
		});
		const status = await this.statusRepository.findOne({ where: { orderId: order.id } });

		const user = await this.userRepository.findOne({
			where: {
				id: order.userId,
			},
		});

		const type = await this.typeRepository.findOne({ where: { type: order.file.type } });
		const operator = await this.userRepository.findOne({ where: { typeId: type.id } });
		console.log(user.email, "------", operator.email);

		const userMustRender = Object.values(this.clients).filter((client) => {
			return client.data?.user?.id === user?.id;
		});

		const operatorMustRender = Object.values(this.clients).filter((client) => {
			return client.data?.user?.id === operator?.id;
		});

		// console.log(this.clients.map((el) => ({ ...el.data })));
		// console.log(this.server);
		status.status = payload.status;

		await status.save();

		if (payload.status === "pending") {
			status.message = "Ожидает принятия";
		}

		if (payload.status === "job") {
			status.message = "В работе";
		}

		if (payload.status === "resolved") {
			const operatorSettings = await this.operatorSettingsRepository.findOne({
				where: { userId: operator.id },
			});

			const money = (Number(order.price) / 100) * operatorSettings.dealPercent;

			operatorSettings.totalEarnings = operatorSettings.totalEarnings + money;
			operatorSettings.save();
			status.message = "Выполнен";
		}

		if (payload.status === "rejected") {
			const operatorSettings = await this.operatorSettingsRepository.findOne({
				where: { userId: operator.id },
			});
			if (operatorSettings.totalEarnings - operatorSettings.retentionRejection < 0) {
				operatorSettings.totalEarnings = 0;
				await operatorSettings.save();
			} else {
				operatorSettings.totalEarnings =
					operatorSettings.totalEarnings - operatorSettings.retentionRejection;
				await operatorSettings.save();
			}
			status.message = "Отклонен";
		}

		await status.save();

		userMustRender.forEach((user) => {
			user.emit("set_status", {
				id: order.id,
				status: status.status,
				message: status.message,
			});
		});

		operatorMustRender.forEach((operator) => {
			operator.emit("set_status", {
				id: order.id,
				status: status.status,
				message: status.message,
			});
		});
	}

	@SubscribeMessage("set_price")
	async handleSet(
		@ConnectedSocket() socket: Socket,
		@MessageBody() payload: { orderId: number; price: string }
	) {
		const order = await this.orderRepository.findOne({
			where: { id: payload.orderId },
			include: [Status, File],
		});
		const status = await this.statusRepository.findOne({ where: { orderId: order.id } });

		const user = await this.userRepository.findOne({
			where: {
				id: order.userId,
			},
		});

		const type = await this.typeRepository.findOne({ where: { type: order.file.type } });
		const operator = await this.userRepository.findOne({ where: { typeId: type.id } });

		const userMustRender = Object.values(this.clients).filter((client) => {
			return client.data?.user?.id === user.id;
		});

		const operatorMustRender = Object.values(this.clients).filter((client) => {
			return client.data?.user?.id === operator.id;
		});

		order.price = payload.price;
		await order.save();

		operatorMustRender.forEach((client) => {
			client.emit("set_price", {
				id: order.id,
				price: order.price,
			});
		});

		userMustRender.forEach((client) => {
			client.emit("set_price", {
				id: order.id,
				price: order.price,
			});
		});
	}

	@SubscribeMessage("send_message")
	async hanldeMessage(
		@ConnectedSocket() socket: Socket,
		@MessageBody()
		payload: {
			orderId: number;
			message: string;
			type: "action" | "message";
			senderRole: RoleType;
		}
	) {
		const order = await this.orderRepository.findOne({
			where: { id: payload.orderId },
			include: [Status, File],
		});

		const user = await this.userRepository.findOne({
			where: {
				id: order.userId,
			},
		});

		function getCurrentTime() {
			const currentDate = new Date();
			const hours = currentDate.getHours();
			const minutes = currentDate.getMinutes();

			const formattedHours = String(hours).padStart(2, "0");
			const formattedMinutes = String(minutes).padStart(2, "0");

			return `${formattedHours}:${formattedMinutes}`;
		}

		const type = await this.typeRepository.findOne({ where: { type: order.file.type } });
		const operator = await this.userRepository.findOne({ where: { typeId: type.id } });

		if (payload.type === "message") {
			const chat = await this.chatRepository.create({
				text: payload.message,
				type: "message",
				orderId: order.id,
				senderRole: payload.senderRole,
				time: getCurrentTime(),
			});

			const userMustRender = Object.values(this.clients).filter((client) => {
				return client.data?.user?.id === user.id;
			});

			const operatorMustRender = Object.values(this.clients).filter((client) => {
				return client.data?.user?.id === operator.id;
			});

			operatorMustRender.forEach((client) => {
				client.emit("send_message", {
					orderId: order.id,
					chat: chat,
				});
			});

			userMustRender.forEach((client) => {
				client.emit("send_message", {
					orderId: order.id,
					chat: chat,
				});
			});
		} else {
			const chat = await this.chatRepository.create({
				text: payload.message,
				type: "action",
				orderId: order.id,
				senderRole: payload.senderRole,
				time: getCurrentTime(),
			});

			const userMustRender = Object.values(this.clients).filter((client) => {
				return client.data?.user?.id === user.id;
			});

			const operatorMustRender = Object.values(this.clients).filter((client) => {
				return client.data?.user?.id === operator.id;
			});

			operatorMustRender.forEach((client) => {
				client.emit("send_message", {
					orderId: order.id,
					chat: chat,
				});
			});

			userMustRender.forEach((client) => {
				client.emit("send_message", {
					orderId: order.id,
					chat: chat,
				});
			});
		}
	}

	// status: StatusType = "pending";

	@SubscribeMessage("start_counter")
	async handleStartCounter(
		@ConnectedSocket() socket: Socket,
		@MessageBody()
		payload: {
			orderId: number;
			countvalue: string;
			status: StatusType;
		}
	) {
		// this.status = payload.status;
		const order = await this.orderRepository.findOne({
			where: { id: payload.orderId },
			include: [Status, File],
		});

		const user = await this.userRepository.findOne({
			where: {
				id: order.userId,
			},
		});

		const type = await this.typeRepository.findOne({ where: { type: order.file.type } });
		const operator = await this.userRepository.findOne({ where: { typeId: type.id } });
		const userMustRender = Object.values(this.clients).filter((client) => {
			return client.data?.user?.id === user.id;
		});

		const operatorMustRender = Object.values(this.clients).filter((client) => {
			return client.data?.user?.id === operator.id;
		});

		const timeString = payload.countvalue;
		// const timeString = "00 00 10";
		const [hours, minutes, seconds] = timeString.split(" ").map(Number);
		let secondsRemaining = hours * 3600 + minutes * 60 + seconds;
		console.log(payload.status, "---------------------");

		const interval = setInterval(async () => {
			if (secondsRemaining === 0) {
				const operatorSettings = await this.operatorSettingsRepository.findOne({
					where: { userId: operator.id },
				});

				if (operatorSettings.totalEarnings - operatorSettings.fineTardiness < 0) {
					operatorSettings.totalEarnings = 0;
					await operatorSettings.save();
				} else {
					operatorSettings.totalEarnings =
						operatorSettings.totalEarnings - operatorSettings.fineTardiness;
					await operatorSettings.save();
				}

				clearInterval(interval);
			}
			const order = await this.orderRepository.findOne({
				where: { id: payload.orderId },
				include: [Status],
			});
			if (order.status.status !== "job") {
				clearInterval(interval);
			}
			console.log(payload.status);

			const h = Math.floor(secondsRemaining / 3600);
			const m = Math.floor((secondsRemaining % 3600) / 60);
			const s = secondsRemaining % 60;
			const str = `${h.toString().padStart(2, "0")} ${m.toString().padStart(2, "0")} ${s
				.toString()
				.padStart(2, "0")}`;
			console.log(str);

			operatorMustRender.forEach((client) => {
				client.emit("start_counter", {
					orderId: order.id,
					countvalue: str,
				});
			});

			userMustRender.forEach((client) => {
				client.emit("start_counter", {
					orderId: order.id,
					countvalue: str,
				});
			});

			secondsRemaining--;
		}, 1000);
	}

	async handleConnection(socket: Socket, ...args: any[]) {
		try {
			const user = await this.tokenService.validateAccessToken(socket.handshake.auth.token);
			socket.data.user = user;
			this.clients[socket.id] = socket;
			console.log("CONNECTED");
			socket.emit("connectt", user);
		} catch (error) {
			socket.disconnect(true);
		}
	}

	handleDisconnect(client: Socket) {
		delete this.clients[client.id];
	}
}
