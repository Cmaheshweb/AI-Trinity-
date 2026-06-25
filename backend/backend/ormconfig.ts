import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/users/entities/user.entity'; // Existing
import { SubscriptionPlan } from './src/subscriptions/entities/subscription-plan.entity'; // New
import { UserSubscription } from './src/subscriptions/entities/user-subscription.entity'; // New
import { CodeSession } from './src/code-sessions/entities/code-session.entity'; // New

dotenv.config();

const dataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, SubscriptionPlan, UserSubscription, CodeSession], // Add new entities here
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});

export default dataSource;