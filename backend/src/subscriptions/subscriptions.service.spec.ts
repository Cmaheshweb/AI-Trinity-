import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { User } from '../users/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockPlanRepo: Partial<Repository<SubscriptionPlan>>;
  let mockUserSubRepo: Partial<Repository<UserSubscription>>;

  const mockPlan: SubscriptionPlan = {
    id: 'plan-id-1',
    name: 'Basic',
    description: 'Basic Plan',
    price: 9.99,
    currency: 'USD',
    durationDays: 30,
    maxCodeGenerationsPerMonth: 10,
    maxDebugRequestsPerMonth: 20,
    features: {},
    createdAt: new Date(),
    userSubscriptions: [],
  };

  const mockUser: User = {
    id: 'user-id-1',
    email: 'user@example.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserSubscription: UserSubscription = {
    id: 'sub-id-1',
    userId: mockUser.id,
    user: mockUser,
    planId: mockPlan.id,
    plan: mockPlan,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    status: 'active',
    stripeSubscriptionId: null,
    currentGenerationCount: 5,
    currentDebugCount: 10,
    lastResetDate: new Date(),
  };

  beforeEach(async () => {
    mockPlanRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockPlan]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockUserSubRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockUserSubscription]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepo,
        },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockUserSubRepo,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Plan Management Tests ---
  describe('createPlan', () => {
    it('should create a new subscription plan', async () => {
      mockPlanRepo.findOne = jest.fn().mockResolvedValue(null); // No existing plan
      const createDto: CreateSubscriptionPlanDto = {
        name: 'New Plan',
        price: 15.99,
        durationDays: 60,
      };
      const result = await service.createPlan(createDto);
      expect(mockPlanRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockPlanRepo.save).toHaveBeenCalled();
      expect(result.name).toEqual('New Plan');
    });

    it('should throw ConflictException if plan name already exists', async () => {
      mockPlanRepo.findOne = jest.fn().mockResolvedValue(mockPlan); // Plan exists
      const createDto: CreateSubscriptionPlanDto = { ...mockPlan };
      await expect(service.createPlan(createDto)).rejects.toThrow(ConflictException);
    });
  });

  // --- User Subscription Tests ---
  describe('findActiveUserSubscription', () => {
    it('should return active subscription if found', async () => {
      mockUserSubRepo.findOne = jest.fn().mockResolvedValue(mockUserSubscription);
      const result = await service.findActiveUserSubscription(mockUser.id);
      expect(result).toEqual(mockUserSubscription);
      expect(mockUserSubRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, status: 'active' },
          relations: ['plan'],
        }),
      );
    });

    it('should return null if no active subscription', async () => {
      mockUserSubRepo.findOne = jest.fn().mockResolvedValue(null);
      const result = await service.findActiveUserSubscription(mockUser.id);
      expect(result).toBeNull();
    });
  });

  describe('subscribeUser', () => {
    it('should subscribe a user to a plan', async () => {
      mockPlanRepo.findOne = jest.fn().mockResolvedValue(mockPlan);
      mockUserSubRepo.findOne = jest.fn().mockResolvedValue(null); // No active sub
      mockUserSubRepo.create = jest.fn((dto) => ({ ...dto, id: 'new-sub-id' }));

      const result = await service.subscribeUser(
        mockUser,
        mockPlan.id,
        'payment-token-123',
      );
      expect(mockUserSubRepo.save).toHaveBeenCalled();
      expect(result.userId).toEqual(mockUser.id);
      expect(result.planId).toEqual(mockPlan.id);
      expect(result.status).toEqual('active');
    });

    it('should throw BadRequestException for invalid plan ID', async () => {
      mockPlanRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.subscribeUser(mockUser, 'invalid-plan-id', 'token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already has active subscription', async () => {
      mockPlanRepo.findOne = jest.fn().mockResolvedValue(mockPlan);
      mockUserSubRepo.findOne = jest.fn().mockResolvedValue(mockUserSubscription);
      await expect(
        service.subscribeUser(mockUser, mockPlan.id, 'token'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('incrementUsage', () => {
    it('should increment generation count', async () => {
      mockUserSubRepo.findOne = jest.fn().mockResolvedValue({
        ...mockUserSubscription,
        currentGenerationCount: 0,
        plan: { ...mockPlan, maxCodeGenerationsPerMonth: 10 },
      });
      const updatedSub = await service.incrementUsage(mockUser.id, 'generation');
      expect(updatedSub.currentGenerationCount).toBe(1);
      expect(mockUserSubRepo.save).toHaveBeenCalledWith(updatedSub);
    });

    it('should throw BadRequestException if generation limit reached', async () => {
      mockUserSubRepo.findOne = jest.fn().mockResolvedValue({
        ...mockUserSubscription,
        currentGenerationCount: 10,
        plan: { ...mockPlan, maxCodeGenerationsPerMonth: 10 },
      });
      await expect(service.incrementUsage(mockUser.id, 'generation')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reset counts on new month', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1); // Last reset was a month ago

      mockUserSubRepo.findOne = jest.fn().mockResolvedValue({
        ...mockUserSubscription,
        currentGenerationCount: 5,
        currentDebugCount: 5,
        lastResetDate: pastDate,
        plan: { ...mockPlan, maxCodeGenerationsPerMonth: 10, maxDebugRequestsPerMonth: 10 },
      });

      const updatedSub = await service.incrementUsage(mockUser.id, 'generation');
      expect(updatedSub.currentGenerationCount).toBe(1); // Should be reset from 5 to 0, then incremented to 1
      expect(updatedSub.currentDebugCount).toBe(0); // Debug count should also be reset
      expect(updatedSub.lastResetDate.getMonth()).toBe(new Date().getMonth());
      expect(mockUserSubRepo.save).toHaveBeenCalledWith(updatedSub);
    });
  });
});