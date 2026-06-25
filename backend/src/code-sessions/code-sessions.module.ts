import { Module } from '@nestjs/common';
import { CodeSessionsService } from './code-sessions.service';
import { CodeSessionsController } from './code-sessions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeSession } from './entities/code-session.entity';
import { UsersModule } from '../users/users.module';
import { AwsModule } from '../aws/aws.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CodeSession]),
    UsersModule,
    AwsModule, // Import AWS services (S3, SQS)
    SubscriptionsModule, // To check and increment user usage
  ],
  controllers: [CodeSessionsController],
  providers: [CodeSessionsService],
  exports: [CodeSessionsService],
})
export class CodeSessionsModule {}