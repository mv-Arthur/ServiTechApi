import { IsEmail, IsString, Length } from "class-validator";

export class RegistrationDto {
	@IsEmail({}, { message: "не корректный email" })
	@IsString({ message: "должно быть строкой" })
	readonly email: string;

	@IsString({ message: "должно быть строкой" })
	@Length(3, 20, { message: "длина пароля должна быть не менее 3 и не более 20 символов" })
	readonly password: string;
}
