import { Model, Column, DataType, HasOne, Table, ForeignKey } from "sequelize-typescript";
import { Keys } from "./keys.model";
import { User } from "./user.model";

interface CreationAttrs {
	endpoint: string;
	expirationTime: null | number;
	userId: number;
}

@Table({ tableName: "subscription", timestamps: false })
export class Subscription extends Model<Subscription, CreationAttrs> {
	@Column({
		type: DataType.INTEGER,
		unique: true,
		autoIncrement: true,
		primaryKey: true,
	})
	id: number;
	@Column({ type: DataType.TEXT, allowNull: false })
	endpoint: string;
	@Column({ type: DataType.STRING, allowNull: true })
	expirationTime: number | null;
	@HasOne(() => Keys)
	keys: Keys;
	@ForeignKey(() => User)
	@Column({ type: DataType.INTEGER })
	userId: number;
}
