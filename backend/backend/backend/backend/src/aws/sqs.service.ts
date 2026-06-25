import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private readonly logger = new Logger(SqsService.name);

  constructor(private configService: ConfigService) {
    this.queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
    if (!this.queueUrl) {
      this.logger.error('AWS_SQS_QUEUE_URL environment variable is not set.');
      throw new InternalServerErrorException('SQS queue URL not configured.');
    }
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async sendMessage(messageBody: object, delaySeconds = 0): Promise<string> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(messageBody),
        DelaySeconds: delaySeconds,
      });

      const response = await this.sqsClient.send(command);
      this.logger.log(`Message sent to SQS: ${response.MessageId}`);
      return response.MessageId;
    } catch (error) {
      this.logger.error(`Failed to send message to SQS: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to queue code processing request.');
    }
  }
}