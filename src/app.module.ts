import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";

import { ExpressAdapter } from "@nestjs/platform-express";
@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ".env",
		}),
		SequelizeModule.forRoot({
			dialect: "postgres",
			host: process.env.POSTGRES_HOST,
			port: Number(process.env.POSTGRES_PORT),
			username: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_NAME,
			models: [],
			autoLoadModels: true,
		}),
		UserModule,
	],
	controllers: [AppController],
	providers: [AppService, ExpressAdapter],
})
export class AppModule {}
