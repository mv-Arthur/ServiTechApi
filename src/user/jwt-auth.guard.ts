import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { TokenService } from "./service/token.service";
@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private tokenService: TokenService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const req = context.switchToHttp().getRequest();
		try {
			const authHeader = req.headers.authorization;
			const bearer = authHeader.split(" ")[0];
			const token = authHeader.split(" ")[1];

			if (bearer !== "Bearer" || !token) {
				throw new UnauthorizedException("пользователь не авторизован");
			}

			const user = this.tokenService.validateAccessToken(token);
			if (!user) {
				throw new UnauthorizedException("пользователь не авторизован");
			}

			req.user = user;
			return true;
		} catch (err) {
			throw new UnauthorizedException("пользователь не авторизован");
		}
	}
}
