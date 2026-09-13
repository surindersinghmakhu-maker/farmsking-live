import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Return null instead of throwing an UnauthorizedException if token is missing or invalid
    if (err || !user) {
      return null;
    }
    return user;
  }
}
