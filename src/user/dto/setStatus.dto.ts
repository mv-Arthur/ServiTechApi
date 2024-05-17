import { StatusType } from "../types/StatusType";

export class SetStatusDto {
	readonly id: number;
	readonly status: StatusType;
}
