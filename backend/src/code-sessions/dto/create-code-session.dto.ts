import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsBase64 } from 'class-validator';
import { CodeSessionType } from '../../common/constants/app.constants';

export class CreateCodeSessionDto {
  @IsEnum(CodeSessionType)
  sessionType: CodeSessionType;

  @IsString()
  @IsNotEmpty()
  @IsBase64({message: 'Code must be Base64 encoded.'})
  // For security, code is sent as Base64. It will be decoded and stored in S3.
  code: string;

  @IsString()
  @IsOptional()
  requestedLanguage?: string;

  @IsString()
  @IsOptional()
  requestedFramework?: string;

  @IsObject()
  @IsOptional()
  requestDetails?: object;
}