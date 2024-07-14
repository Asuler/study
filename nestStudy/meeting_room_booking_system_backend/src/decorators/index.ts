import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

export const RequireLogin = () => SetMetadata('require_login', true);
export const RequirePermission = (permissions: string[]) =>
  SetMetadata('require_permission', permissions);

export const UserInfo = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      return null;
    }
    return key ? request.user[key] : request.user;
  },
);
