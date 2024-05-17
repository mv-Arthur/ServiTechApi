import {
	Body,
	Controller,
	Get,
	HttpStatus,
	Param,
	Post,
	Res,
	UsePipes,
	Req,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Patch,
	HttpException,
	Delete,
} from "@nestjs/common";
import { Response, Request } from "express";
import { UserService } from "./service/user.service";
import { RegistrationDto } from "./dto/registration.dto";
import { ValidationPipe } from "../pipes/validation.pipe";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { OrderService } from "./service/order.service";
import { AddOrderDto } from "./dto/addOrder.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { RoleGuard } from "./role.guard";
import { SetPriceDto } from "./dto/setPrice.dto";
import { SetStatusDto } from "./dto/setStatus.dto";
import { updateDescriptionDto } from "./dto/updateDescription.dto";
import { CreateTypeDto } from "./dto/createType.dto";
import {
	AvatarDto,
	nameDto,
	patronymicDto,
	phoneNumberDto,
	surnameDto,
} from "./dto/personalCreation.dto";
import { BotService } from "./service/bot.service";
import { SwtichRoleDto } from "./dto/switchRole.dto";
import { MailToResetDto, ResetDto } from "./dto/reset.dto";
import { ExtendedOrgDto, IdDto, OrganizationDto } from "./dto/organization.dto";

export interface PushSubscription {
	endpoint: string;
	expirationTime?: number | null;
	keys: {
		p256dh: string;
		auth: string;
	};
}
@Controller("user")
export class UserController {
	constructor(
		private userService: UserService,
		private orderService: OrderService,
		private botService: BotService
	) {}

	_ = (async () =>
		await this.userService.setOrganization({
			email: "bmt@gmail.com",
			phoneNumber: "+7 962 570 10 58",
			accNumber: "40702810680060657001",
			address: "г. Бугугльма ул. Ленина д.122",
			description: "Занимаемся предоставлением услуг в ИТ отделе",
		}))();

	@UsePipes(ValidationPipe)
	@Post("/registration")
	async registration(@Body() dto: RegistrationDto, @Res() res: Response) {
		try {
			const { email, password } = dto;
			const userData = await this.userService.registration(email, password);
			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ message: err.message, status: err.status });
			}
			console.log(err);
			return res.json({ message: "непредвиденная ошибка", status: HttpStatus.BAD_REQUEST });
		}
	}

	@Post("/subscription")
	async subscription(@Req() req: Request, @Res() res: Response) {
		const sub: PushSubscription = req.body.subscription;
		const userId: number = req.body.id;
		await this.userService.subscribe(sub, userId);
		return {
			message: "успешно подписан",
		};
	}

	@Post("/resubscribe")
	async resubscribe(@Req() req: Request, @Res() res: Response) {
		const sub: PushSubscription = req.body.subscription;
		const userId: number = req.body.id;

		await this.userService.resubscribe(sub, userId);
		return {
			message: "успешно переподписан",
		};
	}

	@Get("/subscription/:id")
	async unsubscribe(@Param("id") id: number) {
		const subscription = await this.userService.unsubscribe(id);
		return subscription;
	}

	@Get("pushKey/:id")
	async getPushKey(@Param("id") id: number) {
		const key = await this.userService.getPushKey(id);
		return { publicKey: key };
	}

	@UsePipes(ValidationPipe)
	@Post("/login")
	async login(@Body() dto: RegistrationDto, @Res() res: Response) {
		try {
			const { email, password } = dto;
			const userData = await this.userService.login(email, password);
			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ message: err.message, status: err.status });
			}
			return res.json({ message: "непредвиденная ошибка", status: HttpStatus.BAD_REQUEST });
		}
	}

	@Post("/logout")
	async logout(@Req() req: Request, @Res() res: Response) {
		try {
			const { refreshToken } = req.cookies;
			const token = await this.userService.logout(refreshToken);
			res.clearCookie("refreshToken");
			res.status(HttpStatus.OK).json(token);
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ message: err.message, status: err.status });
			}
			return res.json({ message: "непредвиденная ошибка", status: HttpStatus.BAD_REQUEST });
		}
	}

	@Get("/activate/:link")
	async activate(@Param("link") activationLink: string, @Res() res: Response) {
		try {
			await this.userService.activate(activationLink);
			return res.redirect(process.env.CLIENT_URL);
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ message: err.message, status: err.status });
			}
			return res.json({ message: "непредвиденная ошибка", status: HttpStatus.BAD_REQUEST });
		}
	}

	@Get("/refresh")
	async refresh(@Req() req: Request, @Res() res: Response) {
		try {
			const { refreshToken } = req.cookies;
			const userData = await this.userService.refresh(refreshToken);
			res.cookie(userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			res.json(userData);
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ message: err.message, status: err.status });
			}
			return res.json({ message: "непредвиденная ошибка", status: HttpStatus.BAD_REQUEST });
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post("/addOrder/:id")
	@UseInterceptors(FileInterceptor("file"))
	async addOrder(
		@Body() dto: AddOrderDto,
		@UploadedFile() file: Express.Multer.File,
		@Param("id") userId: number
	) {
		const order = await this.orderService.addOrder(userId, file, dto);
		return order;
	}

	@Get("/getOrder/:id")
	async getOrder(@Param("id") id: number) {
		return await this.orderService.getOrderById(id);
	}

	@Get("/getOrder")
	async getAllOrder() {
		return await this.orderService.getAllOrder();
	}
	// @UseGuards(JwtAuthGuard)
	@Get("/activate/admin/:link")
	async activateAdmin(@Param("link") activationAdminLink: string) {
		await this.userService.activateAdmin(activationAdminLink);
		return {
			message: "Успех",
		};
	}

	@UseGuards(RoleGuard)
	@Patch("/setPrice")
	async setPrice(@Body() dto: SetPriceDto) {
		await this.orderService.setPrice(dto.id, dto.price);
		return {
			message: "Успех",
		};
	}

	@UseGuards(RoleGuard)
	@Patch("/setStatus")
	async setStatus(@Body() dto: SetStatusDto) {
		const { id, status } = dto;
		if (!["pending", "job", "resolved", "rejected"].includes(status)) {
			throw new HttpException("неверный статус", HttpStatus.BAD_REQUEST);
		}
		await this.orderService.setStatus(id, status);
		return {
			message: "Успех",
		};
	}

	@UseGuards(JwtAuthGuard)
	@Patch("/updateDescription")
	async updateDescription(@Body() dto: updateDescriptionDto) {
		const { id, description } = dto;
		await this.orderService.updateDescription(id, description);
		return {
			message: "Успех",
		};
	}

	// @UseGuards(RoleGuard)
	@Post("/createType")
	@UseInterceptors(FileInterceptor("file"))
	async createType(@Body() dto: CreateTypeDto, @UploadedFile() file: Express.Multer.File) {
		const newType = await this.orderService.createType(dto, file);
		return {
			message: "Успех",
			data: newType,
		};
	}

	// @UseGuards(JwtAuthGuard)
	@Get("/download/:id")
	async download(@Param("id") orderId: number, @Res() res: Response) {
		const file = await this.orderService.download(orderId);
		res.download(file);
	}

	@UseGuards(JwtAuthGuard)
	@Get("/types")
	async getTypeAll() {
		return this.orderService.getAllType();
	}

	@UseGuards(RoleGuard)
	@Delete("/types/:id")
	async deleteTypeById(@Param("id") id: number) {
		return await this.orderService.deleteType(id);
	}

	@Get("/test")
	async testToGetUsersByAdmin() {
		return this.orderService.getAlluser();
	}

	@Patch("/name")
	async setName(@Body() dto: nameDto) {
		const { userId, name } = dto;
		return await this.userService.setName(userId, name);
	}

	@Patch("/surname")
	async setSurname(@Body() dto: surnameDto) {
		const { userId, surname } = dto;
		return await this.userService.setSurname(userId, surname);
	}

	@Patch("/patronymic")
	async setPatronymic(@Body() dto: patronymicDto) {
		const { userId, patronymic } = dto;
		return await this.userService.setPatronymic(userId, patronymic);
	}

	@Patch("/phoneNumber")
	async setPhoneNumber(@Body() dto: phoneNumberDto) {
		const { userId, phoneNumber } = dto;
		return await this.userService.phoneNumber(userId, phoneNumber);
	}

	@Patch("/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async setAvatar(@Body() dto: AvatarDto, @UploadedFile() file: Express.Multer.File) {
		const { userId } = dto;
		return await this.userService.setAvatar(userId, file);
	}

	@Post("/acc")
	async report() {
		return await this.orderService.setReport();
	}

	@Get("acc")
	async getAllAcc() {
		return await this.orderService.getRevenue();
	}

	@Post("/switchRole")
	async swtichRole(@Body() dto: SwtichRoleDto) {
		const { role, id } = dto;
		return await this.userService.switchRole(id, role);
	}

	@Post("/reset")
	async sendMailToReset(@Body() dto: MailToResetDto) {
		const { email } = dto;
		const data = await this.userService.sendMailToReset(email);
	}

	@Get("/reset/:link")
	redirectToClient(@Res() res: Response, @Param("link") link: string) {
		res.redirect(`${process.env.CLIENT_URL}/reset/${link}`);
	}

	@Post("/reset/:link")
	async resetPass(@Param("link") link: string, @Body() dto: ResetDto) {
		const { newPassword } = dto;
		await this.userService.resetPassword(link, newPassword);
		return {
			message: "Успех",
		};
	}

	@Post("/setOrganization")
	async setOrganization(@Body() dto: OrganizationDto) {
		await this.userService.setOrganization(dto);
		return {
			message: "Успех",
		};
	}

	@Patch("/setOrganization")
	async editOrganization(@Body() dto: ExtendedOrgDto) {
		const result = await this.userService.editOrganization(dto);
		return result;
	}

	@Get("/setOrganization/:id")
	async getOrg(@Param("id") id: number) {
		return await this.userService.getOrg(id);
	}

	@Patch("/setOrgAvatar")
	@UseInterceptors(FileInterceptor("file"))
	async setAvatarOrg(@Body() dto: IdDto, @UploadedFile() file: Express.Multer.File) {
		const result = await this.userService.setAvatarOrg(dto.id, file);
		return result;
	}
}
