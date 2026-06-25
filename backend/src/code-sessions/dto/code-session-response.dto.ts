import { CodeSessionStatus, CodeSessionType } from '../../common/constants/app.constants';

export class CodeSessionResponseDto {
  id: string;
  userId: string;
  sessionType: CodeSessionType;
  status: CodeSessionStatus;
  requestedLanguage?: string;
  requestedFramework?: string;
  requestDetails?: object;
  resultDetails?: object;
  createdAt: Date;
  expiresAt?: Date;
  outputDownloadUrl?: string; // For presigned S3 URL
}