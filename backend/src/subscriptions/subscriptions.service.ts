import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionsRepository: Repository<UserSubscription>,
  ) {}

  // --- Subscription Plans Management (Admin functionality) ---
  async createPlan(
    createSubscriptionPlanDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const existingPlan = await this.subscriptionPlansRepository.findOne({
      where: { name: createSubscriptionPlanDto.name },
    });
    if (existingPlan) {
      throw new ConflictException('Subscription plan with this name already exists.');
    }
    const newPlan =
      this.subscriptionPlansRepository.create(createSubscriptionPlanDto);
    return this.subscriptionPlansRepository.save(newPlan);
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlansRepository.find();
  }

  async findPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found.`);
    }
    return plan;
  }

  async updatePlan(
    id: string,
    updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const plan = await this.findPlanById(id); // Ensures plan exists
    Object.assign(plan, updateSubscriptionPlanDto);
    return this.subscriptionPlansRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const result = await this.subscriptionPlansRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found.`);
    }
  }

  // --- User Subscription Management ---
  async findActiveUserSubscription(userId: string): Promise<UserSubscription | null> {
    // Only fetch active subscription that has not expired
    return this.userSubscriptionsRepository.findOne({
      where: {
        userId: userId,
        status: 'active',
        endDate: { $gt: new Date() } as any, // TypeORM needs special handling for $gt or use a custom query
      },
      relations: ['plan'], // Eager load the plan details
    });
  }

  async subscribeUser(
    user: User,
    planId: string,
    paymentMethodToken: string, // Placeholder for actual payment gateway integration
  ): Promise<UserSubscription> {
    const plan = await this.findPlanById(planId);
    if (!plan) {
      throw new BadRequestException('Invalid subscription plan.');
    }

    const activeSubscription = await this.findActiveUserSubscription(user.id);
    if (activeSubscription) {
      throw new ConflictException('User already has an active subscription.');
    }

    // --- Placeholder for actual payment processing ---
    // In a real application, you would integrate with Stripe/PayPal here.
    // paymentMethodToken would be used to create a charge/subscription.
    // If payment fails, throw an exception.
    // For now, we'll assume payment is successful.
    console.log(`Processing payment for user ${user.id} with plan ${plan.name} using token: ${paymentMethodToken}`);
    // --- End Placeholder ---

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const newSubscription = this.userSubscriptionsRepository.create({
      userId: user.id,
      planId: plan.id,
      startDate: new Date(),
      endDate: endDate,
      status: 'active',
      // stripeSubscriptionId: 'actual_stripe_sub_id_here', // Store actual ID after successful payment
      currentGenerationCount: 0,
      currentDebugCount: 0,
      lastResetDate: new Date(), // Initialize for monthly resets
    });

    return this.userSubscriptionsRepository.save(newSubscription);
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return this.userSubscriptionsRepository.find({
      where: { userId: userId },
      relations: ['plan'],
      order: { startDate: 'DESC' },
    });
  }

  async incrementUsage(userId: string, type: 'generation' | 'debug'): Promise<UserSubscription> {
    const subscription = await this.findActiveUserSubscription(userId);
    if (!subscription) {
      throw new BadRequestException('No active subscription found.');
    }

    // Check for monthly reset
    const now = new Date();
    const lastReset = subscription.lastResetDate;
    if (!lastReset || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        subscription.currentGenerationCount = 0;
        subscription.currentDebugCount = 0;
        subscription.lastResetDate = now;
    }

    if (type === 'generation') {
      if (subscription.plan.maxCodeGenerationsPerMonth !== null &&
          subscription.currentGenerationCount >= subscription.plan.maxCodeGenerationsPerMonth) {
        throw new BadRequestException('Maximum code generation limit reached for this month.');
      }
      subscription.currentGenerationCount++;
    } else if (type === 'debug') {
      if (subscription.plan.maxDebugRequestsPerMonth !== null &&
          subscription.currentDebugCount >= subscription.plan.maxDebugRequestsPerMonth) {
        throw new BadRequestException('Maximum debug request limit reached for this month.');
      }
      subscription.currentDebugCount++;
    }

    return this.userSubscriptionsRepository.save(subscription);
  }
}