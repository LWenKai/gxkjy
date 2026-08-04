import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiErrorResponse } from './response.types';

interface JsonResponse {
  status(statusCode: number): {
    json(body: ApiErrorResponse): void;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<JsonResponse>();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request?.method || 'UNKNOWN'} ${request?.url || ''} failed`,
        stack,
      );
    }

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.getMessage(errorResponse, status);
    const code = this.getCode(errorResponse, status);

    const body: ApiErrorResponse = {
      success: false,
      message,
      code,
    };

    response.status(status).json(body);
  }

  private getMessage(errorResponse: unknown, status: number) {
    if (typeof errorResponse === 'string') {
      return this.normalizeValidationMessage(errorResponse);
    }
    if (errorResponse && typeof errorResponse === 'object') {
      const message = (errorResponse as { message?: unknown }).message;
      if (Array.isArray(message)) {
        return this.normalizeValidationMessage(String(message[0] || '\u8bf7\u68c0\u67e5\u586b\u5199\u5185\u5bb9'));
      }
      if (typeof message === 'string') {
        return this.normalizeValidationMessage(message);
      }
    }
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return '\u670d\u52a1\u6682\u65f6\u5f02\u5e38';
    }
    return '\u8bf7\u68c0\u67e5\u8bf7\u6c42';
  }

  private normalizeValidationMessage(message: string) {
    if (message.includes('must be one of the following values')) {
      return '\u8bf7\u9009\u62e9\u6b63\u786e\u7684\u72b6\u6001\u6216\u7c7b\u578b';
    }
    if (message.includes('must not be greater than')) {
      return '\u6bcf\u9875\u6570\u91cf\u4e0d\u80fd\u8d85\u8fc7\u4e0a\u9650';
    }
    return message;
  }

  private getCode(errorResponse: unknown, status: number) {
    if (errorResponse && typeof errorResponse === 'object') {
      const code = (errorResponse as { code?: unknown }).code;
      if (typeof code === 'string') {
        return code;
      }
    }
    return `HTTP_${status}`;
  }
}
