import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsNumber()
  @Min(1)
  durationDays: number; // e.g., 30 for monthly, 365 for yearly

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxCodeGenerationsPerMonth?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDebugRequestsPerMonth?: number;

  @IsObject()
  @IsOptional()
  features?: object;
}