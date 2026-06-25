import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Register User entity with TypeORM
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Export UsersService so AuthModule can use it
})
export class UsersModule {}