import { Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { S3Service } from './s3.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Make ConfigService available
  providers: [SqsService, S3Service],
  exports: [SqsService, S3Service], // Export so other modules can use them
})
export class AwsModule {}