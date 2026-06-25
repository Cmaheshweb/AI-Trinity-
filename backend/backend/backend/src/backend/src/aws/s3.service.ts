import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!this.bucketName) {
      this.logger.error('AWS_S3_BUCKET_NAME environment variable is not set.');
      throw new InternalServerErrorException('S3 bucket name not configured.');
    }
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(
    key: string,
    body: string | Buffer,
    contentType: string = 'text/plain',
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      this.logger.log(`File uploaded to S3: s3://${this.bucketName}/${key}`);
      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3 (${key}): ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to storage.');
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for S3 object (${key}): ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get download URL.');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: s3://${this.bucketName}/${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3 (${key}): ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file from storage.');
    }
  }
}