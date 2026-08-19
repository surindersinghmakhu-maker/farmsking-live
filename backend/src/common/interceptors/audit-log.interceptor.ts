import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const REDACT_KEYS = new Set(['password', 'passwordHash', 'securityAnswer', 'securityAnswerHash', 'newPassword']);
const UUID_LIKE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function redact(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (REDACT_KEYS.has(key)) clone[key] = '[REDACTED]';
  }
  return clone;
}

/** Turns "/api/v1/users/<uuid>/active-roles" into "users.active-roles" for a readable action label. */
function deriveAction(path: string): string {
  const segments = path
    .replace(/^\/api\/v1\//, '')
    .split('/')
    .filter((segment) => segment && !UUID_LIKE.test(segment));
  return segments.join('.') || path;
}

/**
 * Records every mutating request (POST/PATCH/PUT/DELETE) to `audit_logs` for Super Admin oversight.
 * Purely additive — a logging failure is swallowed so it can never break the actual request.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;
    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const write = (statusCode: number) => {
      try {
        const path: string = request.originalUrl?.split('?')[0] ?? request.url;
        this.prisma.auditLog
          .create({
            data: {
              actorId: request.user?.id,
              actorRole: request.user?.role,
              method,
              path,
              action: deriveAction(path),
              targetId: request.params?.id,
              statusCode,
              metadata: { body: redact(request.body) } as Prisma.InputJsonValue,
            },
          })
          .catch((err) => console.error('AuditLogInterceptor write failed:', err));
      } catch (err) {
        console.error('AuditLogInterceptor failed:', err);
      }
    };

    return next.handle().pipe(
      tap(() => write(context.switchToHttp().getResponse().statusCode)),
      catchError((err) => {
        write(err?.status ?? 500);
        return throwError(() => err);
      }),
    );
  }
}
