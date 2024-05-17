import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "./user.model";

interface CreationAttrs {
	publicKey: string;
	privateKey: string;
	userId: number;
}

@Table({ tableName: "vapid", timestamps: false })
export class Vapid extends Model<Vapid, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: false })
	publicKey: string;
	@Column({ type: DataType.STRING, allowNull: false, defaultValue: "0" })
	privateKey: string;
	@ForeignKey(() => User)
	@Column({ type: DataType.INTEGER })
	userId: number;
}
