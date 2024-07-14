import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { FormatResponseInterceptor } from 'src/interceptor/format-response.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor());

  const configService = app.get(ConfigService);

  await app.listen(configService.get('nest_server_port'));
}
bootstrap();
