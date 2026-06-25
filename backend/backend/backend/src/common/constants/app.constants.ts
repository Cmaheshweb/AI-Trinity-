export const CODE_STORAGE_EXPIRATION_DAYS = 5; // User code will be stored for this many days
export const S3_CODE_PATH_PREFIX = 'user-code/';
export const S3_OUTPUT_PATH_PREFIX = 'generated-output/';

export enum CodeSessionType {
  GENERATION = 'generation',
  DEBUGGING = 'debugging',
  DEPLOYMENT_ASSIST = 'deployment_assist',
}

export enum CodeSessionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}