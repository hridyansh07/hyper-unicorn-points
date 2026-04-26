import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const httpException = this.toHttpException(exception);
    const status = httpException.getStatus();
    const body = httpException.getResponse();

    this.logger.error({
      message: exception.message,
      path: request.url,
      method: request.method,
      prismaCode:
        exception instanceof Prisma.PrismaClientKnownRequestError
          ? exception.code
          : undefined,
      prismaMeta:
        exception instanceof Prisma.PrismaClientKnownRequestError
          ? exception.meta
          : undefined,
    });

    response.status(status).json({
      statusCode: status,
      path: request.url,
      ...(typeof body === 'string' ? { message: body } : body),
    });
  }

  private toHttpException(exception: Error): HttpException {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return new ConflictException('Unique constraint failed');
        case 'P2025':
          return new NotFoundException('Requested record was not found');
        case 'P2003':
          return new ConflictException('Foreign key constraint failed');
        default:
          return new InternalServerErrorException('Database request failed');
      }
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return new ServiceUnavailableException('Database is unavailable');
    }

    return new InternalServerErrorException('Database operation failed');
  }
}
