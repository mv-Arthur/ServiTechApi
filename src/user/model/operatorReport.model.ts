import {
  Column,
  DataType,
  Table,
  Model,
  ForeignKey,
  BelongsToMany,
  HasMany,
} from "sequelize-typescript";

import { Order } from "./order.model";
import { Subscription } from "./subscription.model";

interface CreationAttrs {
  operatorId: number;
  date: string;
  totalEarnings: number;
}

@Table({ tableName: "operatorReport", timestamps: false })
export class OperatorReport extends Model<OperatorReport, CreationAttrs> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;
  @Column({ type: DataType.STRING, allowNull: false })
  date: string;
  @Column({ type: DataType.INTEGER, allowNull: false })
  operatorId: number;
  @Column({ type: DataType.INTEGER, allowNull: false })
  totalEarnings: number;
  @HasMany(() => Order)
  order: Order[];
}
