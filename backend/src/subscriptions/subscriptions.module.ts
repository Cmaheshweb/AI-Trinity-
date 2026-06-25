import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { UsersModule } from '../users/users.module'; // To interact with User entity/service

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription]), UsersModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService], // Export so other modules (like CodeSessions) can use it
})
export class SubscriptionsModule {}