import { RoleType } from "../types/RoleType";
import { User } from "../model/user.model";
import { Personal } from "../model/personal.model";
import { OperatorSettings } from "../model/operatorSettings.model";

export class UserDto {
	email: string;
	id: number;
	isActivated: boolean;
	role: RoleType;
	constructor(model: User) {
		this.email = model.email;
		this.id = model.id;
		this.isActivated = model.isActivated;
		this.role = model.role;
	}
}

export class UserDtoForOperator {
	email: string;
	name: string;
	surname: string;
	patronymic: string;
	phoneNumber: string;
	avatar: string;

	constructor(user: User, personal: Personal) {
		this.email = user.email;
		this.name = personal.name;
		this.surname = personal.surname;
		this.patronymic = personal.patronymic;
		this.phoneNumber = personal.phoneNumber;
		this.avatar = personal.avatar;
	}
}

export class SettingsDto {
	fulfillmentTime: string;
	dealPercent: number;
	fineTardiness: number;
	retentionRejection: number;
	totalEarnings: number;

	constructor(settings: OperatorSettings) {
		this.fulfillmentTime = settings.fulfillmentTime;
		this.dealPercent = settings.dealPercent;
		this.fineTardiness = settings.fineTardiness;
		this.retentionRejection = settings.retentionRejection;
		this.totalEarnings = settings.totalEarnings;
	}
}
