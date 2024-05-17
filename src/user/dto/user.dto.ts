import { RoleType } from "../types/RoleType";
import { User } from "../model/user.model";

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
