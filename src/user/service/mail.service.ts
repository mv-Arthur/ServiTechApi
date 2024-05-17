import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
@Injectable()
export class MailService {
	private readonly transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMPT_PORT,
			secure: true,
			auth: {
				user: process.env.SMPT_USER,
				pass: process.env.SMPT_PASSWORD,
			},
		});
	}

	async sendActivationMail(to: string, link: string) {
		await this.transporter.sendMail({
			from: process.env.SMPT_USER,
			to: to,
			subject: `активация аккаунта на ${process.env.API_URL}`,
			text: "",
			html: `
					<div>
						<h1>Для активации перейдите по ссылке</h1>
						<a href="${link}">${link}</a>
					</div>
				`,
		});
	}

	async recuperation(to: string, link: string) {
		await this.transporter.sendMail({
			from: process.env.SMPT_USER,
			to: to,
			subject: `восстановление доступа к аккаунту на ${process.env.API_URL}`,
			text: "",
			html: `
					<div>
						<h1>для сброса пароля перейдите по ссылке</h1>
						<a href="${link}">${link}</a>
					</div>
				`,
		});
	}
}
