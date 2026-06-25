import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get databaseHost(): string {
    return this.configService.get<string>('DB_HOST');
  }

  get databasePort(): number {
    return this.configService.get<number>('DB_PORT');
  }

  get databaseUsername(): string {
    return this.configService.get<string>('DB_USERNAME');
  }

  get databasePassword(): string {
    return this.configService.get<string>('DB_PASSWORD');
  }

  get databaseName(): string {
    return this.configService.get<string>('DB_DATABASE');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpirationTime(): string {
    return this.configService.get<string>('JWT_EXPIRATION_TIME');
  }

  get port(): number {
    return this.configService.get<number>('PORT');
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV');
  }
}