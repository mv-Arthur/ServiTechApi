import { Personal } from "../model/personal.model";

export class nameDto {
	readonly userId: number;
	readonly name: string;
}

export class surnameDto {
	readonly userId: number;
	readonly surname: string;
}

export class patronymicDto {
	readonly userId: number;
	readonly patronymic: string;
}

export class phoneNumberDto {
	readonly userId: number;
	readonly phoneNumber: string;
}

export class AvatarDto {
	readonly userId: number;
}

export class PersonalDto {
	name: string;
	surname: string;
	patronymic: string;
	phoneNumber: string;
	avatar: string;
	constructor(model: Personal) {
		this.name = model.name;
		this.surname = model.surname;
		this.patronymic = model.patronymic;
		this.phoneNumber = model.phoneNumber;
		this.avatar = model.avatar;
	}
}
