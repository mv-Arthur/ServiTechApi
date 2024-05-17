import { Column, DataType, Table, Model, ForeignKey, HasOne, HasMany } from "sequelize-typescript";
import { Report } from "./report.model";
interface CreationAttrs {
	revenue: string;
	date: string;
	rejectedQty: string;
	fullfiledQty: string;
}

@Table({ tableName: "dateU", timestamps: false })
export class DateU extends Model<DateU, CreationAttrs> {
	@Column({
		type: DataType.INTEGER,
		unique: true,
		autoIncrement: true,
		primaryKey: true,
	})
	id: number;

	@Column({ type: DataType.STRING, allowNull: false })
	revenue: string;

	@Column({ type: DataType.STRING, allowNull: false })
	date: string;

	@Column({ type: DataType.STRING, allowNull: false })
	rejectedQty: string;

	@Column({ type: DataType.STRING, allowNull: false })
	fullfiledQty: string;

	@HasMany(() => Report)
	report: Report[];
}
