import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (!request || !response) {
      return next.handle();
    }

    let requestId = (request.headers['x-request-id'] as string) || '';
    if (!requestId) {
      requestId = randomUUID();
    }

    (request as any).requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const { method } = request;
    const url = request.originalUrl || request.url;
    const startAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startAt;
        const statusCode = response.statusCode;
        this.logger.log(
          `${method} ${url} ${statusCode} - ${duration}ms [reqId=${requestId}]`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startAt;
        const statusCode = response.statusCode || error?.status || 500;
        const message = error?.message || 'Unhandled error';
        this.logger.error(
          `${method} ${url} ${statusCode} - ${duration}ms [reqId=${requestId}] ${message}`,
          error?.stack,
        );
        return throwError(() => error);
      }),
    );
  }
}
