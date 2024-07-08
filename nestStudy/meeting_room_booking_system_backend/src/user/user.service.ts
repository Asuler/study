import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { RedisService } from '../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { md5, uniqBy } from 'src/util';
import { LoginUserDto } from './dto/LoginUserDto';
import { LoginUserVo, type UserInfo } from './vo/LoginUserVO';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.OK);
    }
    if (user.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = user.username;
    newUser.password = md5(user.password);
    newUser.email = user.email;
    newUser.nickName = user.nickName;
    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      this.logger.error(error);
      return '注册失败';
    }
  }

  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.OK);
    }
    if (user.password !== md5(loginUser.password)) {
      throw new HttpException('密码不正确', HttpStatus.OK);
    }
    const userVo = new LoginUserVo();
    userVo.userInfo = this.transferUserToUserInfo(user);
    const { accessToken, refreshToken } = this.genToken(userVo.userInfo);
    userVo.accessToken = accessToken;
    userVo.refreshToken = refreshToken;
    return userVo;
  }

  genToken(user: UserInfo) {
    const accessToken = this.jwtService.sign(
      {
        userId: user.id,
        userName: user.username,
        roles: user.roles,
        permissions: user.permissions,
      },
      {
        expiresIn: this.configService.get('jwt_access_token_expires_time'),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: user.id,
      },
      {
        expiresIn: this.configService.get('jwt_refresh_token_expres_time'),
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }
  transferUserToUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      isFrozen: user.isFrozen,
      createTime: user.createTime.getTime(),
      isAdmin: user.isAdmin,
      roles: user.roles.map((role) => role.name),
      permissions: uniqBy<Permission>(
        user.roles.map((role) => role.permissions).flat(),
        'code',
      ),
    };
  }

  async findUserById(userId: string, isAdmin: boolean): Promise<UserInfo> {
    const user = await this.userRepository.findOne({
      where: {
        id: +userId,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    return this.transferUserToUserInfo(user);
  }

  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = md5('111111');
    user1.email = 'xxx@xx.com';
    user1.isAdmin = true;
    user1.nickName = '张三';
    user1.phoneNumber = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5('222222');
    user2.email = 'yy@yy.com';
    user2.nickName = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }
}
