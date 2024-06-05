import { Type } from "../model/type.model";

export class TypeDto {
	readonly name: string;
	readonly description: string;
	readonly minPrice: string;
}

export class CreationTypeDto {
	name: string;
	description: string;
	minPrice: string;
	constructor(dto: Type) {
		this.name = dto.name;
		this.description = dto.description;
		this.minPrice = dto.minPrice;
	}
}

export class CreateTypeDto extends TypeDto {
	readonly type: string;
}

export class CreateSettingsDto {
	readonly fulfillmentTime: string;
	readonly dealPercent: number;
	readonly fineTardiness: number;
	readonly retentionRejection: number;
	readonly userId: number;
}
