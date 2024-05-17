import { Column, DataType, Table, Model, ForeignKey } from "sequelize-typescript";

interface CreationAttrs {
	email: string;
	phoneNumber: string;
	accNumber: string;
	address: string;
	description: string;
	avatar: string;
}

@Table({ tableName: "organization", timestamps: false })
export class Organization extends Model<Organization, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: true })
	email: string;
	@Column({ type: DataType.STRING, allowNull: true })
	phoneNumber: string;
	@Column({ type: DataType.STRING, allowNull: true })
	accNumber: string;
	@Column({ type: DataType.STRING, allowNull: true })
	address: string;
	@Column({ type: DataType.STRING, allowNull: true })
	description: string;
	@Column({ type: DataType.STRING, allowNull: true })
	avatar: string;
}
