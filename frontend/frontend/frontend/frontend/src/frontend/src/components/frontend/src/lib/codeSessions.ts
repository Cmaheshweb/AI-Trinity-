import { api } from './api';
import { CodeSessionStatus, CodeSessionType } from './constants';

// Mirrors backend DTO for creating a code session request
export interface CreateCodeSessionRequest {
  sessionType: CodeSessionType;
  code: string; // Base64 encoded code
  requestedLanguage?: string;
  requestedFramework?: string;
  requestDetails?: object; // e.g., generation prompt, debug options, deploy parameters
}

// Mirrors backend DTO for code session response
export interface CodeSessionResponse {
  id: string;
  userId: string;
  sessionType: CodeSessionType;
  status: CodeSessionStatus;
  requestedLanguage?: string;
  requestedFramework?: string;
  requestDetails?: object;
  resultDetails?: object;
  createdAt: Date;
  expiresAt?: Date;
  outputDownloadUrl?: string; // Presigned S3 URL for completed sessions
}

export const createCodeSession = async (
  sessionData: CreateCodeSessionRequest,
): Promise<CodeSessionResponse> => {
  try {
    const response = await api.post<CodeSessionResponse>(
      '/code/process',
      sessionData,
      true, // Authenticated request
    );
    return response;
  } catch (error) {
    console.error('Failed to create code session:', error);
    throw error;
  }
};

export const fetchUserSessions = async (): Promise<CodeSessionResponse[]> => {
  try {
    const response = await api.get<CodeSessionResponse[]>(
      '/code/sessions/me',
      true, // Authenticated request
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch user sessions:', error);
    throw error;
  }
};

export const fetchSessionDetails = async (sessionId: string): Promise<CodeSessionResponse> => {
  try {
    const response = await api.get<CodeSessionResponse>(
      `/code/sessions/${sessionId}`,
      true, // Authenticated request
    );
    return response;
  } catch (error) {
    console.error(`Failed to fetch session ${sessionId} details:`, error);
    throw error;
  }
};