import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import { join } from "path";
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		credentials: true,
		origin: process.env.CLIENT_URL,
	});

	console.log(join(__dirname, "user", "uploads"));
	app.use("/uploads", express.static(join(__dirname, "user", "uploads")));
	app.use(cookieParser());

	const PORT = process.env.PORT || 3000;
	await app.listen(PORT, () => console.log(`server listening on port: ${PORT}`));
}
bootstrap();
