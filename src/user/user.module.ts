import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./service/user.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { User } from "./model/user.model";
import { Token } from "./model/token.model";
import { MailService } from "./service/mail.service";
import { TokenService } from "./service/token.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Order } from "./model/order.model";
import { File } from "./model/file.model";
import { Status } from "./model/status.model";
import { OrderService } from "./service/order.service";
import { MulterModule } from "@nestjs/platform-express";
import { RoleGuard } from "./role.guard";
import { Type } from "./model/type.model";
import { Vapid } from "./model/vapid.model";
import { Subscription } from "./model/subscription.model";
import { Keys } from "./model/keys.model";
import * as express from "express";
import { join } from "path";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Personal } from "./model/personal.model";
import { BotService } from "./service/bot.service";
import { DateU } from "./model/dateU.model";
import { Report } from "./model/report.model";
import { Organization } from "./model/organisation.model";
@Module({
	controllers: [UserController],
	providers: [
		ExpressAdapter,
		UserService,
		MailService,
		TokenService,
		JwtAuthGuard,
		OrderService,
		RoleGuard,
		BotService,
	],
	imports: [
		JwtModule.register({}),
		ConfigModule,
		SequelizeModule.forFeature([
			User,
			Token,
			Order,
			File,
			Status,
			Type,
			Vapid,
			Subscription,
			Keys,
			Personal,
			DateU,
			Report,
			Organization,
		]),
		MulterModule.register({
			dest: "./dist/user/uploads",
		}),
	],
})
export class UserModule {}
