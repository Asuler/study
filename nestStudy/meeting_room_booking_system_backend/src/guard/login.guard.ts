import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject(Reflector)
  reflactor: Reflector;

  @Inject(JwtService)
  jwtService: JwtService;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const requireLogin = this.reflactor.getAllAndOverride('require_login', [
      context.getClass(),
      context.getHandler(),
    ]);

    // 非强制登录的接口
    if (!requireLogin) {
      return true;
    }
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('用户未登录');
    }
    try {
      const token = authorization.split(' ')[1];
      const data = this.jwtService.verify(token);
      request.user = {
        userId: data.userId,
        userName: data.userName,
        role: data.role,
        permissions: data.permissions,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('用户登录失效');
    }
  }
}
