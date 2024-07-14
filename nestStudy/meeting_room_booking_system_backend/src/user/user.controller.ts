import {
  Controller,
  Post,
  Body,
  Inject,
  Get,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { LoginUserDto } from './dto/LoginUserDto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

@Controller('user')
export class UserController {
  @Inject(UserService)
  userService: UserService;

  @Inject(EmailService)
  emailService: EmailService;

  @Inject(RedisService)
  redisService: RedisService;

  @Inject(JwtService)
  jwtService: JwtService;

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return this.userService.register(registerUser);
  }

  @Get('send-captcha')
  async sendCaptcha(@Query('email') email): Promise<string> {
    const code = Math.random().toString().slice(2, 8);
    await this.redisService.set(`captcha_${email}`, code, 60);
    await this.emailService.sendMail({
      to: email || '124346431@qq.com' || '1325214045@qq.com',
      subject: '会议室预定',
      html: `
        <div>
          <p>您的验证码是：${code}</p>
          <p>验证码有效时间为60s</p>
        </div>
      `,
    });
    return '发送成功';
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    return this.userService.login(loginUser, false);
  }

  @Post('admin/login')
  async adminLogin(@Body() loginAdmin: LoginUserDto) {
    return this.userService.login(loginAdmin, true);
  }

  @Get('refresh')
  async refreshToken(
    @Query() userRefreshToken: string,
    isAdmin: boolean = false,
  ) {
    try {
      const data = this.jwtService.verify(userRefreshToken);
      const user = await this.userService.findUserById(data.userId, isAdmin);
      const { accessToken, refreshToken } = this.userService.genToken(user);
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }
  @Get('admin/refresh')
  async refreshAdminToken(@Query() userRefreshToken: string) {
    return this.refreshToken(userRefreshToken, true);
  }
}
