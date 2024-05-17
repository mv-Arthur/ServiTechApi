export class OrganizationDto {
	readonly email: string;
	readonly phoneNumber: string;
	readonly accNumber: string;
	readonly address: string;
	readonly description: string;
}

export class ExtendedOrgDto extends OrganizationDto {
	readonly id: number;
}

export class IdDto {
	readonly id: number;
}
