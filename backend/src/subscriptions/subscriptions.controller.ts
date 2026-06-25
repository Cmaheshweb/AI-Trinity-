import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard) // All subscription routes require authentication
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // --- Admin Endpoints (for creating/managing plans - requires admin role in a real app) ---
  // For simplicity, these are currently only protected by JWT.
  // In a full production system, you'd add an RBAC guard (e.g., @Roles('admin'))
  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  createPlan(
    @Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto,
  ): Promise<any> { // Should return SubscriptionPlan, adjusted for brevity
    return this.subscriptionsService.createPlan(createSubscriptionPlanDto);
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ): Promise<any> { // Should return SubscriptionPlan
    return this.subscriptionsService.updatePlan(id, updateSubscriptionPlanDto);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlan(@Param('id') id: string): Promise<void> {
    return this.subscriptionsService.deletePlan(id);
  }
  // --- End Admin Endpoints ---

  @Get('plans')
  findAllPlans(): Promise<any[]> { // Should return SubscriptionPlan[]
    return this.subscriptionsService.findAllPlans();
  }

  @Get('plans/:id')
  findPlanById(@Param('id') id: string): Promise<any> { // Should return SubscriptionPlan
    return this.subscriptionsService.findPlanById(id);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  subscribe(
    @CurrentUser() user: User,
    @Body() subscribeDto: SubscribeDto,
  ): Promise<any> { // Should return UserSubscription
    return this.subscriptionsService.subscribeUser(
      user,
      subscribeDto.planId,
      subscribeDto.paymentMethodToken,
    );
  }

  @Get('me')
  findMySubscriptions(@CurrentUser('id') userId: string): Promise<any[]> { // Should return UserSubscription[]
    return this.subscriptionsService.getUserSubscriptions(userId);
  }

  @Get('me/active')
  findMyActiveSubscription(@CurrentUser('id') userId: string): Promise<any> { // Should return UserSubscription
    return this.subscriptionsService.findActiveUserSubscription(userId);
  }
}