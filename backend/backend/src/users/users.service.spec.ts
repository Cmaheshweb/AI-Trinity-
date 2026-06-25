import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 'test-uuid-1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      const hashedPassword = 'hashedNewPassword';

      jest.spyOn(repository, 'create').mockReturnValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser);

      const result = await service.create(registerDto, hashedPassword);
      expect(repository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.findOneByEmail('test@example.com');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user not found by email', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);
      const result = await service.findOneByEmail('nonexistent@example.com');
      expect(result).toBeUndefined();
    });
  });

  describe('findOneById', () => {
    it('should return a user by ID', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.findOneById('test-uuid-1');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'test-uuid-1' } });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user not found by ID', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);
      const result = await service.findOneById('nonexistent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return a UserDto for the current user', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      const { passwordHash, ...expectedDto } = mockUser; // Simulate stripping hash
      const result = await service.getCurrentUser('test-uuid-1');
      expect(result).toEqual(expectedDto);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'test-uuid-1' } });
    });

    it('should throw NotFoundException if current user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);
      await expect(service.getCurrentUser('nonexistent-id')).rejects.toThrow(
        new NotFoundException('User not found.'),
      );
    });
  });
});