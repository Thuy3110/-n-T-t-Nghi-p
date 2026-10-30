import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role?.trim().toUpperCase();
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPER USER'].includes(role ?? '')) {
      throw new ForbiddenException('Chỉ Admin mới được thực hiện chức năng này.');
    }
    return true;
  }
}
