import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // Do not log 404 or 401/403 to Sentry to avoid spam
      if (status >= 500) {
        Sentry.captureException(exception);
      }
    } else {
      // Unhandled exceptions (e.g. 500s)
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
