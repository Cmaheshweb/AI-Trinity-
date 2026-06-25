import { Test, TestingModule } from '@nestjs/testing';
import { CodeSessionsService } from './code-sessions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeSession } from './entities/code-session.entity';
import { S3Service } from '../aws/s3.service';
import { SqsService } from '../aws/sqs.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { User } from '../users/entities/user.entity';
import {
  CODE_STORAGE_EXPIRATION_DAYS,
  S3_CODE_PATH_PREFIX,
  CodeSessionStatus,
  CodeSessionType,
  S3_OUTPUT_PATH_PREFIX,
} from '../../src/common/constants/app.constants';
import { CreateCodeSessionDto } from './dto/create-code-session.dto';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('CodeSessionsService', () => {
  let service: CodeSessionsService;
  let mockCodeSessionRepo: Partial<Repository<CodeSession>>;
  let mockS3Service: Partial<S3Service>;
  let mockSqsService: Partial<SqsService>;
  let mockSubscriptionsService: Partial<SubscriptionsService>;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCodeSession: CodeSession = {
    id: 'session-id-1',
    userId: mockUser.id,
    user: mockUser,
    sessionType: CodeSessionType.GENERATION,
    status: CodeSessionStatus.PENDING,
    inputS3Key: 'user-code/user-id-1/session-id-1/input.txt',
    outputS3Key: null,
    requestedLanguage: 'Python',
    requestedFramework: 'Django',
    requestDetails: {},
    resultDetails: {},
    createdAt: new Date(),
    expiresAt: new Date(new Date().setDate(new Date().getDate() + CODE_STORAGE_EXPIRATION_DAYS)),
  };

  beforeEach(async () => {
    mockCodeSessionRepo = {
      create: jest.fn((dto) => ({ id: 'new-session-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    mockS3Service = {
      uploadFile: jest.fn().mockResolvedValue('s3://bucket/key'),
      getPresignedUrl: jest.fn().mockResolvedValue('https://presigned-url.com/file'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    mockSqsService = {
      sendMessage: jest.fn().mockResolvedValue('message-id-123'),
    };

    mockSubscriptionsService = {
      incrementUsage: jest.fn().mockResolvedValue({ /* mock user subscription */ }),
      findActiveUserSubscription: jest.fn().mockResolvedValue({
        plan: {
          maxCodeGenerationsPerMonth: 100,
          maxDebugRequestsPerMonth: 100,
        },
        currentGenerationCount: 0,
        currentDebugCount: 0,
        lastResetDate: new Date(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeSessionsService,
        {
          provide: getRepositoryToken(CodeSession),
          useValue: mockCodeSessionRepo,
        },
        { provide: S3Service, useValue: mockS3Service },
        { provide: SqsService, useValue: mockSqsService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    }).compile();

    service = module.get<CodeSessionsService>(CodeSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCodeSession', () => {
    const createDto: CreateCodeSessionDto = {
      sessionType: CodeSessionType.GENERATION,
      code: Buffer.from('console.log("hello");').toString('base64'),
      requestedLanguage: 'JavaScript',
    };

    it('should create a code session, upload to S3, queue to SQS', async () => {
      mockCodeSessionRepo.create = jest.fn().mockReturnValue(mockCodeSession);
      const result = await service.createCodeSession(mockUser, createDto);

      expect(mockSubscriptionsService.incrementUsage).toHaveBeenCalledWith(
        mockUser.id,
        'generation',
      );
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining(`${S3_CODE_PATH_PREFIX}${mockUser.id}/${mockCodeSession.id}/input.txt`),
        'console.log("hello");',
        'text/plain',
      );
      expect(mockCodeSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          sessionType: CodeSessionType.GENERATION,
          status: CodeSessionStatus.PENDING,
        }),
      );
      expect(mockSqsService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: mockCodeSession.id,
          userId: mockUser.id,
          sessionType: CodeSessionType.GENERATION,
        }),
      );
      expect(result.id).toEqual(mockCodeSession.id);
      expect(result.status).toEqual(CodeSessionStatus.PENDING);
    });

    it('should throw InternalServerErrorException if S3 upload fails', async () => {
      mockSubscriptionsService.incrementUsage = jest.fn().mockResolvedValue({}); // Reset mock
      mockS3Service.uploadFile = jest.fn().mockRejectedValue(new Error('S3 error'));
      await expect(service.createCodeSession(mockUser, createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getCodeSession', () => {
    it('should return a code session with presigned URL if completed', async () => {
      const completedSession = {
        ...mockCodeSession,
        status: CodeSessionStatus.COMPLETED,
        outputS3Key: `${S3_OUTPUT_PATH_PREFIX}${mockUser.id}/${mockCodeSession.id}/output.txt`,
      };
      mockCodeSessionRepo.findOne = jest.fn().mockResolvedValue(completedSession);

      const result = await service.getCodeSession(mockCodeSession.id, mockUser.id);
      expect(result.id).toEqual(completedSession.id);
      expect(result.status).toEqual(CodeSessionStatus.COMPLETED);
      expect(result.outputDownloadUrl).toBe('https://presigned-url.com/file');
      expect(mockS3Service.getPresignedUrl).toHaveBeenCalledWith(completedSession.outputS3Key);
    });

    it('should return a code session without presigned URL if not completed', async () => {
      mockCodeSessionRepo.findOne = jest.fn().mockResolvedValue(mockCodeSession); // pending status

      const result = await service.getCodeSession(mockCodeSession.id, mockUser.id);
      expect(result.id).toEqual(mockCodeSession.id);
      expect(result.status).toEqual(CodeSessionStatus.PENDING);
      expect(result.outputDownloadUrl).toBeUndefined();
      expect(mockS3Service.getPresignedUrl).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found or no access', async () => {
      mockCodeSessionRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.getCodeSession('non-existent', mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSessionStatusAndOutput', () => {
    it('should update session status and upload output if completed', async () => {
      mockCodeSessionRepo.findOne = jest.fn().mockResolvedValue(mockCodeSession);
      const outputContent = 'updated code';
      const resultDetails = { debugErrors: ['error1'] };

      const result = await service.updateSessionStatusAndOutput(
        mockCodeSession.id,
        CodeSessionStatus.COMPLETED,
        outputContent,
        resultDetails,
      );

      expect(result.status).toEqual(CodeSessionStatus.COMPLETED);
      expect(result.resultDetails).toEqual(resultDetails);
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining(`${S3_OUTPUT_PATH_PREFIX}${mockUser.id}/${mockCodeSession.id}/output.txt`),
        outputContent,
        'text/plain',
      );
      expect(result.outputS3Key).toBeDefined();
      expect(mockCodeSessionRepo.save).toHaveBeenCalledWith(result);
    });

    it('should update session status without uploading output if not completed', async () => {
      mockCodeSessionRepo.findOne = jest.fn().mockResolvedValue(mockCodeSession);

      const result = await service.updateSessionStatusAndOutput(
        mockCodeSession.id,
        CodeSessionStatus.PROCESSING,
      );

      expect(result.status).toEqual(CodeSessionStatus.PROCESSING);
      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
      expect(result.outputS3Key).toBeNull();
      expect(mockCodeSessionRepo.save).toHaveBeenCalledWith(result);
    });
  });
});