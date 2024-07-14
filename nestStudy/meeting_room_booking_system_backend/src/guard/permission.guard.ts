import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject(Reflector)
  reflector: Reflector;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const dataPermissionCodes = this.reflector.getAllAndOverride(
      'require_permission',
      [context.getClass(), context.getHandler()],
    );
    if (!dataPermissionCodes) {
      return true;
    }
    for (let i = 0; i < dataPermissionCodes.length; i++) {
      const requiredPermissionCode = dataPermissionCodes[i];
      const found = request.user.permissions.find(
        (p) => p.code === requiredPermissionCode,
      );
      if (!found) {
        throw new UnauthorizedException('没有权限');
      }
    }

    return true;
  }
}
