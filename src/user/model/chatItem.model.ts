import { Column, DataType, Table, Model, ForeignKey, HasOne } from "sequelize-typescript";
import { User } from "./user.model";

import { Status } from "./status.model";
import { File } from "./file.model";
import { Order } from "./order.model";
import { RoleType } from "../types/RoleType";

interface CreationAttrs {
	time: string;
	text: string;
	type: "action" | "message";
	orderId: number;
	senderRole: RoleType;
}

@Table({ tableName: "chat", timestamps: false })
export class Chat extends Model<Chat, CreationAttrs> {
	@Column({
		type: DataType.INTEGER,
		unique: true,
		autoIncrement: true,
		primaryKey: true,
	})
	id: number;

	@Column({ type: DataType.STRING, allowNull: false })
	time: string;
	@Column({ type: DataType.STRING, allowNull: false, defaultValue: "0" })
	text: string;
	@Column({ type: DataType.STRING, allowNull: false, defaultValue: "0" })
	type: "action" | "message";
	@Column({ type: DataType.STRING, allowNull: false, defaultValue: "0" })
	senderRole: RoleType;
	@ForeignKey(() => Order)
	@Column({ type: DataType.INTEGER })
	orderId: number;
}
