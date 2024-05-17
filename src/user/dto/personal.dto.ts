import { Personal } from "../model/personal.model";

export class PersonalDto {
	name: string;
	surname: string;
	patronymic: string;
	phoneNumber: string;
	avatar: string;
	constructor(personalModel: Personal) {
		this.name = personalModel.name;
		this.surname = personalModel.surname;
		this.patronymic = personalModel.patronymic;
		this.phoneNumber = personalModel.phoneNumber;
		this.avatar = personalModel.avatar;
	}
}
