import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { CodeSessionsService } from './code-sessions.service';
import { CreateCodeSessionDto } from './dto/create-code-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CodeSessionResponseDto } from './dto/code-session-response.dto';
import { CodeSessionStatus } from '../common/constants/app.constants';

@Controller('code')
@UseGuards(JwtAuthGuard)
export class CodeSessionsController {
  constructor(private readonly codeSessionsService: CodeSessionsService) {}

  @Post('process')
  @HttpCode(HttpStatus.ACCEPTED) // Indicates that the request has been accepted for processing
  async createSession(
    @CurrentUser() user: User,
    @Body() createCodeSessionDto: CreateCodeSessionDto,
  ): Promise<CodeSessionResponseDto> {
    return this.codeSessionsService.createCodeSession(user, createCodeSessionDto);
  }

  @Get('sessions/me')
  async getUserSessions(
    @CurrentUser('id') userId: string,
  ): Promise<CodeSessionResponseDto[]> {
    return this.codeSessionsService.getUserCodeSessions(userId);
  }

  @Get('sessions/:sessionId')
  async getSessionDetails(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CodeSessionResponseDto> {
    return this.codeSessionsService.getCodeSession(sessionId, userId);
  }

  // --- Internal/Webhook Endpoint (Not for direct user access) ---
  // This endpoint would be called by the `AI TrinityPro Engine` (e.g., Lambda function)
  // once code processing is complete. It needs to be secured with a separate mechanism
  // (e.g., AWS API Gateway custom authorizer, shared secret, or IP whitelist).
  // For now, it's public for conceptual completeness but MUST be secured in production.
  @Post('internal/update-session/:sessionId')
  @HttpCode(HttpStatus.OK)
  async updateSessionInternal(
    @Param('sessionId') sessionId: string,
    @Body() updateBody: { status: CodeSessionStatus, outputContent?: string, resultDetails?: object },
  ): Promise<any> { // Should return CodeSession
    // IMPORTANT: Implement robust security for this internal endpoint!
    // e.g., if (updateBody.secret !== process.env.INTERNAL_WEBHOOK_SECRET) throw new UnauthorizedException();
    return this.codeSessionsService.updateSessionStatusAndOutput(
      sessionId,
      updateBody.status,
      updateBody.outputContent,
      updateBody.resultDetails,
    );
  }
}