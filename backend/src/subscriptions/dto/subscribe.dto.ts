import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @IsUUID()
  planId: string;

  @IsString()
  @IsNotEmpty()
  // This would typically be a token from a payment gateway like Stripe
  paymentMethodToken: string;
}