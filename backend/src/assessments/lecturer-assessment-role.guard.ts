import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class LecturerAssessmentRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();
    const role = request.user?.role?.trim().toUpperCase();

    if (
      !['LECTURER', 'ADMIN', 'SUPER_ADMIN', 'SUPER USER'].includes(role ?? '')
    ) {
      throw new ForbiddenException(
        'Chỉ giảng viên hoặc quản trị viên mới được truy cập đánh giá CLO.',
      );
    }

    return true;
  }
}
