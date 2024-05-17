import { Column, DataType, Table, Model, HasMany, HasOne, ForeignKey } from "sequelize-typescript";
import { User } from "./user.model";

interface CreationAttrs {
	userId: number;
	refreshToken: string;
}

@Table({ tableName: "token", timestamps: false })
export class Token extends Model<Token, CreationAttrs> {
	@Column({ type: DataType.STRING, allowNull: false })
	refreshToken: string;

	@ForeignKey(() => User)
	@Column({ type: DataType.INTEGER })
	userId: number;
}
