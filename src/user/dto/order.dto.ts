import { File } from "../model/file.model";
import { Order } from "../model/order.model";
import { Status } from "../model/status.model";
import { Type } from "../model/type.model";

export class OrderDto {
	id: number;
	description: string;
	price: string;
	status: string;
	message: string;
	file: string;
	type: string;
	name: string;
	imgName: string;
	constructor(order: Order, status: Status, file: File, type: Type) {
		this.id = order.id;
		this.description = order.description;
		this.price = order.price;
		this.status = status.status;
		this.message = status.message;
		this.file = file.path;
		this.type = file.type;
		this.name = type.name;
		this.imgName = type.fileName;
	}
}
