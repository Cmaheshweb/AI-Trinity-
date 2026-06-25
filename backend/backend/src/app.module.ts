import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import dataSource from '../ormconfig'; // Import the DataSource configuration

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available everywhere
      envFilePath: '.env', // Path to your environment file
    }),
    TypeOrmModule.forRoot(dataSource.options), // Use the imported dataSource.options
    DatabaseModule, // For database related configurations, though TypeOrmModule.forRoot handles primary connection
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}