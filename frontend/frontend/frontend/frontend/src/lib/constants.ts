export const ACCESS_TOKEN_KEY = 'accessToken';
export const USER_INFO_KEY = 'userInfo'; // To store basic user info from JWT payload or profile API

// Backend constants (mirroring backend for type safety/consistency)
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