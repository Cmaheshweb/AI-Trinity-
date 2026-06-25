import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import * as bcrypt from 'bcrypt'; // Import bcrypt here

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') || '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Provide bcrypt directly for hashing if needed in a service, otherwise use in AuthService
    {
      provide: 'BCRYPT_SALT_ROUNDS',
      useValue: 10, // Recommended salt rounds
    },
    {
      provide: 'BCRYPT',
      useValue: bcrypt,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}