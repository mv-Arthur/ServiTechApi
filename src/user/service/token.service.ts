import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import { Token } from "../model/token.model";
import { UserDto } from "../dto/user.dto";

@Injectable()
export class TokenService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		@InjectModel(Token) private tokenRepository: typeof Token
	) {}

	generateToken(payload: UserDto) {
		const accessToken = this.jwtService.sign(payload, {
			secret: this.configService.get("JWT_ACCESS_SECRET"),
			expiresIn: "30m",
		});
		const refreshToken = this.jwtService.sign(payload, {
			secret: this.configService.get("JWT_REFRESH_SECRET"),
			expiresIn: "30d",
		});
		return {
			accessToken: accessToken,
			refreshToken: refreshToken,
		};
	}

	async saveToken(userId: number, refreshToken: string) {
		const tokenData = await this.tokenRepository.findOne({ where: { userId: userId } });
		if (tokenData) {
			tokenData.refreshToken = refreshToken;
			return tokenData.save();
		}

		const token = await this.tokenRepository.create({
			userId: userId,
			refreshToken: refreshToken,
		});
		return token;
	}

	async removeToken(refreshToken: string) {
		const tokenData = await this.tokenRepository.findOne({
			where: {
				refreshToken: refreshToken,
			},
		});

		await this.tokenRepository.destroy({
			where: {
				refreshToken: tokenData.refreshToken,
			},
		});

		return tokenData;
	}

	validateAccessToken(token: string) {
		try {
			const userData = this.jwtService.verify(token, {
				secret: process.env.JWT_ACCESS_SECRET,
			});
			return userData;
		} catch (err) {
			return null;
		}
	}

	validateRefreshToken(token: string) {
		try {
			const userData = this.jwtService.verify(token, {
				secret: process.env.JWT_REFRESH_SECRET,
			});
			return userData;
		} catch (err) {
			return null;
		}
	}

	async findToken(refreshToken: string) {
		const tokenData = await this.tokenRepository.findOne({
			where: {
				refreshToken: refreshToken,
			},
		});

		return tokenData;
	}
}
