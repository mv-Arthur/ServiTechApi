import { Column, DataType, Table, Model, ForeignKey } from "sequelize-typescript";

import { Order } from "./order.model";

interface CreationAttrs {
	orderId: number;
}

@Table({ tableName: "status", timestamps: false })
export class Status extends Model<Status, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: false, defaultValue: "pending" })
	status: string;
	@Column({ type: DataType.STRING, allowNull: false, defaultValue: "ожидает принятия" })
	message: string;

	@ForeignKey(() => Order)
	@Column({ type: DataType.INTEGER })
	orderId: number;
}
