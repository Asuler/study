import { Global, Module } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  controllers: [EmailController],
  providers: [
    EmailService,
    {
      provide: 'Email_Client',
      useFactory: (configService: ConfigService) => {
        const transporter = createTransport({
          host: configService.get('nodemailer_host'),
          port: configService.get('nodemailer_port'),
          secure: false,
          auth: {
            user: configService.get('nodemailer_auth_user'),
            pass: configService.get('nodemailer_auth_pass'),
          },
        });
        return transporter;
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService, 'Email_Client'],
})
export class EmailModule {}
