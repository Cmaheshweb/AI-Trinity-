import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module'; // New
import { CodeSessionsModule } from './code-sessions/code-sessions.module'; // New
import { AwsModule } from './aws/aws.module'; // New
import dataSource from '../ormconfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(dataSource.options),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule, // New module
    CodeSessionsModule, // New module
    AwsModule, // New module for AWS services
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}