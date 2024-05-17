import { Column, DataType, Table, Model, ForeignKey, BelongsToMany } from "sequelize-typescript";

interface CreationAttrs {
	name: string;
	type: string;
	fileName: string;
	description: string;
	minPrice: string;
}

@Table({ tableName: "type", timestamps: false })
export class Type extends Model<Type, CreationAttrs> {
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
}
