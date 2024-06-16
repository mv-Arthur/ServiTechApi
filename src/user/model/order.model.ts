import {
  Column,
  DataType,
  Table,
  Model,
  ForeignKey,
  HasOne,
  HasMany,
} from "sequelize-typescript";
import { User } from "./user.model";

import { Status } from "./status.model";
import { File } from "./file.model";
import { Chat } from "./chatItem.model";
import { OperatorReport } from "./operatorReport.model";

interface CreationAttrs {
  description: string;
  userId: number;
}

@Table({ tableName: "order", timestamps: false })
export class Order extends Model<Order, CreationAttrs> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  description: string;
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "0" })
  price: string;
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  archived: boolean;
  @Column({ type: DataType.STRING })
  date: string;
  @HasOne(() => Status, { onDelete: "CASCADE" })
  status: Status;
  @HasOne(() => File, { onDelete: "CASCADE" })
  file: File;

  @HasMany(() => Chat)
  chat: Chat;
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  userId: number;

  @ForeignKey(() => OperatorReport)
  @Column({ type: DataType.INTEGER })
  operatorReportId: number;
}
