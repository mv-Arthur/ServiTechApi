import { Column, DataType, Table, Model, ForeignKey, BelongsToMany } from "sequelize-typescript";

import { Order } from "./order.model";
import { Subscription } from "./subscription.model";

interface CreationAttrs {
	p256dh: string;
	auth: string;
	subscriptionId: number;
}

@Table({ tableName: "keys", timestamps: false })
export class Keys extends Model<Keys, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: false })
	p256dh: string;
	@Column({ type: DataType.STRING, allowNull: false })
	auth: string;

	@ForeignKey(() => Subscription)
	@Column({ type: DataType.INTEGER })
	subscriptionId: number;
}
