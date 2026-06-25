import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionHandlerFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    const errorMessage =
      typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message || 'An unexpected error occurred';
    const errorCode =
      (errorResponse as any).error || exception.constructor.name;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage, // For validation errors
      error: errorCode,
    });
  }
}