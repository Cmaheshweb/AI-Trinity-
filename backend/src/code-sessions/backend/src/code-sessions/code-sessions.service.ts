import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeSession } from './entities/code-session.entity';
import { CreateCodeSessionDto } from './dto/create-code-session.dto';
import { User } from '../users/entities/user.entity';
import { S3Service } from '../aws/s3.service';
import { SqsService } from '../aws/sqs.service';
import {
  CODE_STORAGE_EXPIRATION_DAYS,
  S3_CODE_PATH_PREFIX,
  CodeSessionStatus,
  S3_OUTPUT_PATH_PREFIX,
} from '../../src/common/constants/app.constants';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CodeSessionResponseDto } from './dto/code-session-response.dto';

@Injectable()
export class CodeSessionsService {
  constructor(
    @InjectRepository(CodeSession)
    private codeSessionsRepository: Repository<CodeSession>,
    private s3Service: S3Service,
    private sqsService: SqsService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createCodeSession(
    user: User,
    createCodeSessionDto: CreateCodeSessionDto,
  ): Promise<CodeSessionResponseDto> {
    // 1. Check Subscription and Usage limits
    await this.subscriptionsService.incrementUsage(user.id, createCodeSessionDto.sessionType === 'generation' ? 'generation' : 'debug');

    // 2. Decode Base64 code and upload to S3
    const decodedCode = Buffer.from(createCodeSessionDto.code, 'base64').toString('utf8');
    const sessionId = this.codeSessionsRepository.create().id; // Generate UUID for session early
    const inputS3Key = `${S3_CODE_PATH_PREFIX}${user.id}/${sessionId}/input.txt`;

    try {
      await this.s3Service.uploadFile(inputS3Key, decodedCode, 'text/plain');
    } catch (error) {
      throw new InternalServerErrorException('Failed to store code for processing.');
    }

    // 3. Calculate expiration date for S3 object
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CODE_STORAGE_EXPIRATION_DAYS);

    // 4. Save code session details to database
    const newSession = this.codeSessionsRepository.create({
      id: sessionId,
      userId: user.id,
      sessionType: createCodeSessionDto.sessionType,
      status: CodeSessionStatus.PENDING,
      inputS3Key: inputS3Key,
      requestedLanguage: createCodeSessionDto.requestedLanguage,
      requestedFramework: createCodeSessionDto.requestedFramework,
      requestDetails: createCodeSessionDto.requestDetails,
      expiresAt: expiresAt,
    });
    await this.codeSessionsRepository.save(newSession);

    // 5. Send message to SQS for async processing
    const sqsMessage = {
      sessionId: newSession.id,
      userId: newSession.userId,
      sessionType: newSession.sessionType,
      inputS3Key: newSession.inputS3Key,
      requestedLanguage: newSession.requestedLanguage,
      requestedFramework: newSession.requestedFramework,
      requestDetails: newSession.requestDetails,
    };
    await this.sqsService.sendMessage(sqsMessage);

    // 6. Return response DTO
    return this.mapSessionToResponseDto(newSession);
  }

  async getCodeSession(sessionId: string, userId: string): Promise<CodeSessionResponseDto> {
    const session = await this.codeSessionsRepository.findOne({
      where: { id: sessionId, userId: userId },
    });
    if (!session) {
      throw new NotFoundException(`Code session with ID ${sessionId} not found or you don't have access.`);
    }

    const responseDto = this.mapSessionToResponseDto(session);
    // If output is available and session is complete, generate a presigned URL
    if (session.outputS3Key && session.status === CodeSessionStatus.COMPLETED) {
      responseDto.outputDownloadUrl = await this.s3Service.getPresignedUrl(session.outputS3Key);
    }
    return responseDto;
  }

  async getUserCodeSessions(userId: string): Promise<CodeSessionResponseDto[]> {
    const sessions = await this.codeSessionsRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
    });
    const dtos: CodeSessionResponseDto[] = [];
    for (const session of sessions) {
      const dto = this.mapSessionToResponseDto(session);
      if (session.outputS3Key && session.status === CodeSessionStatus.COMPLETED) {
        dto.outputDownloadUrl = await this.s3Service.getPresignedUrl(session.outputS3Key);
      }
      dtos.push(dto);
    }
    return dtos;
  }

  // --- Internal method for the AI TrinityPro Engine to update session status ---
  // This would typically be called by a separate process (e.g., Lambda triggered by SQS)
  async updateSessionStatusAndOutput(
    sessionId: string,
    status: CodeSessionStatus,
    outputContent: string = '',
    resultDetails: object = {},
  ): Promise<CodeSession> {
    const session = await this.codeSessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Code session with ID ${sessionId} not found.`);
    }

    session.status = status;
    session.resultDetails = resultDetails;

    if (outputContent && status === CodeSessionStatus.COMPLETED) {
      const outputS3Key = `${S3_OUTPUT_PATH_PREFIX}${session.userId}/${session.id}/output.txt`;
      await this.s3Service.uploadFile(outputS3Key, outputContent, 'text/plain');
      session.outputS3Key = outputS3Key;
    }

    return this.codeSessionsRepository.save(session);
  }

  private mapSessionToResponseDto(session: CodeSession): CodeSessionResponseDto {
    const { user, ...sessionData } = session; // Destructure to exclude user entity
    const dto = new CodeSessionResponseDto();
    Object.assign(dto, sessionData);
    delete dto['inputS3Key']; // Do not expose input S3 key directly
    delete dto['outputS3Key']; // Do not expose output S3 key directly, use presigned URL

    return dto;
  }
}