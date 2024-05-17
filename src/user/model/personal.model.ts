import { Column, DataType, Table, Model, ForeignKey } from "sequelize-typescript";

import { User } from "./user.model";

interface CreationAttrs {
	name: string;
	surname: string;
	phoneNumber: string;
	userId: number;
	avatar: string;
	patronymic: string;
}

@Table({ tableName: "personal", timestamps: false })
export class Personal extends Model<Personal, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: true })
	name: string;
	@Column({ type: DataType.STRING, allowNull: true })
	surname: string;
	@Column({ type: DataType.STRING, allowNull: true })
	patronymic: string;
	@Column({ type: DataType.STRING, allowNull: true })
	phoneNumber: string;
	@Column({ type: DataType.STRING, allowNull: true })
	avatar: string;
	@ForeignKey(() => User)
	@Column({ type: DataType.INTEGER })
	userId: number;
}
