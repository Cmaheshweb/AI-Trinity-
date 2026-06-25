import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt'; // Explicitly import bcrypt here

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('BCRYPT_SALT_ROUNDS') private readonly saltRounds: number,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.saltRounds,
    );
    return this.usersService.create(registerDto, hashedPassword);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // This method can be used by JwtStrategy if needed to validate user details beyond token
  async validateUser(payload: { sub: string; email: string }): Promise<User> {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}