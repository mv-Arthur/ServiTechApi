import { Column, DataType, Table, Model, ForeignKey, BelongsToMany } from "sequelize-typescript";
import { User } from "./user.model";
import { Order } from "./order.model";

interface CreationAttrs {
	path: string;
	type: string;
	orderId: number;
}

@Table({ tableName: "file", timestamps: false })
export class File extends Model<File, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: false })
	path: string;
	@Column({ type: DataType.STRING, allowNull: false })
	type: string;

	@ForeignKey(() => Order)
	@Column({ type: DataType.INTEGER })
	orderId: number;
}
