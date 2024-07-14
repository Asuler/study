import { Controller, Get } from '@nestjs/common';
import { RequireLogin, RequirePermission, UserInfo } from 'src/decorators';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @RequireLogin()
  @RequirePermission(['ccc'])
  @Get('aaa')
  aaa(@UserInfo('userName') userName): string {
    console.log(userName);
    return 'aaa';
  }

  @Get('bbb')
  bbb(): string {
    return 'bbb';
  }
}
