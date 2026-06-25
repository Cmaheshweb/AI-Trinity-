import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('user_subscriptions')
@Unique(['user_id', 'status']) // A user can only have one active subscription at a time
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.id)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @CreateDateColumn({ name: 'start_date', type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone' })
  endDate: Date;

  @Column({ length: 50, default: 'active' })
  status: string; // 'active', 'expired', 'cancelled'

  @Column({ name: 'stripe_subscription_id', length: 255, nullable: true, unique: true })
  stripeSubscriptionId: string; // For integration with Stripe or other payment gateways

  @Column({ name: 'current_generation_count', type: 'int', default: 0 })
  currentGenerationCount: number;

  @Column({ name: 'current_debug_count', type: 'int', default: 0 })
  currentDebugCount: number;

  @UpdateDateColumn({ name: 'last_reset_date', type: 'timestamp with time zone', nullable: true })
  lastResetDate: Date; // For monthly reset of counts
}