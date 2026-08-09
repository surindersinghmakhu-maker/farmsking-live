import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

const STATUS_BY_CODE: Record<string, number> = {
  P2002: HttpStatus.CONFLICT,
  P2025: HttpStatus.NOT_FOUND,
  P2003: HttpStatus.BAD_REQUEST,
};

const MESSAGE_BY_CODE: Record<string, string> = {
  P2002: 'A record with this value already exists.',
  P2025: 'The requested record was not found.',
  P2003: 'This operation references a record that does not exist.',
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = MESSAGE_BY_CODE[exception.code] ?? 'An unexpected database error occurred.';

    this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
