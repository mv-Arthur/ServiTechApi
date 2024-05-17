import { Injectable } from "@nestjs/common";
import * as TelegramApi from "node-telegram-bot-api";
import { inlineKeyboard } from "telegraf/typings/markup";
import { UserService } from "./user.service";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "../model/user.model";
@Injectable()
export class BotService {
	constructor(@InjectModel(User) private userRepository: typeof User) {}

	private readonly token = "6949341527:AAEtYJNQMwAdxLY5Xqk2RUvxO5XT8M1smzs";
	private bot = new TelegramApi(this.token, { polling: true });

	start() {
		this.bot.on("message", (msg) => {
			console.log(msg);
		});

		this.bot.on("callback_query", async (query) => {
			const chatId = query.message.chat.id;
			const messageId = query.message.message_id;
			const data = query.data;
			const splitted = data.split(" ");
			if (splitted[0] === "skip") {
				console.log("idhsaihd");
				this.bot.deleteMessage(chatId, messageId);
			}

			if (splitted[0] === "switch") {
				console.log("dawdaw");
				const mes = await this.activateAdmin(splitted[1]);
				await this.bot.sendMessage(chatId, mes);
			}

			if (splitted[0] === "switch2") {
				const mes = await this.activateAccounting(splitted[1]);
				await this.bot.sendMessage(chatId, mes);
			}
		});
	}

	async activateAccounting(activationLinkAdmin: string) {
		const candidate = await this.userRepository.findOne({
			where: { activationLinkAdmin },
		});

		if (!candidate) return "пользователь не найден";

		candidate.role = "accounting";
		candidate.isActivated = true;
		candidate.save();
		return "Роль успешно заменена";
	}

	async activateAdmin(activationLinkAdmin: string) {
		const admin = await this.userRepository.findOne({
			where: { activationLinkAdmin: activationLinkAdmin },
		});
		if (!admin) {
			return "пользователь не найден";
		}
		admin.role = "admin";
		admin.isActivated = true;
		admin.save();
		return "Успех";
	}

	async sendActivationAdmin(activationLinkAdmin: string) {
		const user = await this.userRepository.findOne({ where: { activationLinkAdmin } });
		try {
			await this.bot.sendMessage(
				Number(process.env.SUPERUSERTGID),
				"Зарегестрирован новый пользователь - " + user.email,
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: "сменить роль на Администратора",
									callback_data: "switch " + activationLinkAdmin,
								},
								{ text: "пропустить", callback_data: "skip " + "none" },
								{
									text: "сменить роль на Бухгалтерию",
									callback_data: "switch2 " + activationLinkAdmin,
								},
							],
						],
					},
				}
			);
		} catch (err) {}
	}
}
