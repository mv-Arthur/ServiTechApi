import { Column, DataType, Table, Model, ForeignKey } from "sequelize-typescript";

import { Order } from "./order.model";
import { Subscription } from "./subscription.model";
import { User } from "./user.model";

interface CreationAttrs {
	fulfillmentTime: string;
	dealPercent: number;
	fineTardiness: number;
	retentionRejection: number;
	userId: number;
}

@Table({ tableName: "operatorSettings", timestamps: false })
export class OperatorSettings extends Model<OperatorSettings, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: false })
	fulfillmentTime: string;
	@Column({ type: DataType.INTEGER, allowNull: false })
	dealPercent: number;

	@Column({ type: DataType.INTEGER })
	fineTardiness: number;
	@Column({ type: DataType.INTEGER })
	retentionRejection: number;

	@Column({ type: DataType.INTEGER, defaultValue: 0 })
	totalEarnings: number;

	@ForeignKey(() => User)
	@Column({ type: DataType.INTEGER })
	userId: number;
}
