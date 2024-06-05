import { Column, DataType, Table, Model, HasOne } from "sequelize-typescript";
import { User } from "./user.model";

interface CreationAttrs {
	name: string;
	type: string;
	fileName: string;
	description: string;
	minPrice: string;
}

@Table({ tableName: "type", timestamps: false })
export class Type extends Model<Type, CreationAttrs> {
	@Column({
		type: DataType.INTEGER,
		unique: true,
		autoIncrement: true,
		primaryKey: true,
	})
	id: number;
	@Column({ type: DataType.STRING, allowNull: false })
	name: string;
	@Column({ type: DataType.STRING, allowNull: false, unique: true })
	type: string;
	@Column({ type: DataType.STRING, allowNull: false, unique: true })
	fileName: string;
	@Column({ type: DataType.STRING, allowNull: false, unique: false })
	description: string;
	@Column({ type: DataType.STRING, allowNull: false, unique: false })
	minPrice: string;
	@HasOne(() => User)
	operator: User;
}
