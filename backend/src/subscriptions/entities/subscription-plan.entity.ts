import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string; // e.g., 'Basic', 'Premium', 'Enterprise'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // e.g., 9.99

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'duration_days', type: 'int' })
  durationDays: number; // e.g., 30 for monthly, 365 for yearly

  @Column({ name: 'max_code_generations_per_month', type: 'int', nullable: true })
  maxCodeGenerationsPerMonth: number;

  @Column({ name: 'max_debug_requests_per_month', type: 'int', nullable: true })
  maxDebugRequestsPerMonth: number;

  @Column({ type: 'jsonb', nullable: true })
  features: object; // e.g., { "supported_languages": ["Python", "Node.js"] }

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => UserSubscription, (userSubscription) => userSubscription.plan)
  userSubscriptions: UserSubscription[];
}