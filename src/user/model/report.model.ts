import { Column, DataType, Table, Model, ForeignKey, HasOne } from "sequelize-typescript";
import { DateU } from "./dateU.model";

interface CreationAttrs {
	orderId: number;
	name: string;
	surname: string;
	patronymic: string;
	phoneNumber: string;
	orderType: string;
	orderPrice: string;
	userEmail: string;
	orderDescription: string;
	status: string;
	dateUId: number;
}

@Table({ tableName: "report", timestamps: false })
export class Report extends Model<Report, CreationAttrs> {
	@Column({
		type: DataType.INTEGER,
		unique: true,
		autoIncrement: true,
		primaryKey: true,
	})
	id: number;

	@Column({ type: DataType.INTEGER, allowNull: false })
	orderId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	name: string;

	@Column({ type: DataType.STRING, allowNull: false })
	surname: string;

	@Column({ type: DataType.STRING, allowNull: false })
	patronymic: string;

	@Column({ type: DataType.STRING, allowNull: false })
	phoneNumber: number;

	@Column({ type: DataType.STRING, allowNull: false })
	orderType: string;

	@Column({ type: DataType.STRING, allowNull: false })
	orderPrice: string;

	@Column({ type: DataType.STRING, allowNull: false })
	userEmail: string;

	@Column({ type: DataType.STRING, allowNull: false })
	orderDescription: string;

	@Column({ type: DataType.STRING, allowNull: false })
	status: string;

	@ForeignKey(() => DateU)
	@Column({ type: DataType.INTEGER, allowNull: false })
	dateUId: number;
}
