import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDto } from './dto/user.dto';

@UseGuards(JwtAuthGuard) // Protect all routes in this controller
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string): Promise<UserDto> {
    return this.usersService.getCurrentUser(userId);
  }
}