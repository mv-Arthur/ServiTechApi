import {
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";

import { Observable } from "rxjs";
import { TokenService } from "./service/token.service";
@Injectable()
export class RoleGuard implements CanActivate {
	constructor(private tokenService: TokenService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const req = context.switchToHttp().getRequest();
		try {
			const authHeader = req.headers.authorization;
			const bearer = authHeader.split(" ")[0];
			const token = authHeader.split(" ")[1];

			if (bearer !== "Bearer" || !token) {
				console.log(111);
				throw new UnauthorizedException("пользователь не авторизован");
			}

			const user = this.tokenService.validateAccessToken(token);
			if (!user && user.role !== "admin") {
				console.log(222);
				throw new UnauthorizedException("пользователь не авторизован");
			}

			console.log(user);

			if (user.role === "user") {
				console.log(333);
				throw new HttpException("нет доступа", HttpStatus.FORBIDDEN);
			}

			req.user = user;
			return true;
		} catch (err) {
			throw new HttpException("нет доступа", HttpStatus.FORBIDDEN);
		}
	}
}
