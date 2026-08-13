import { ForbiddenException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

export function checkProjectPermission(
  role: ProjectRole,
  allowedRoles: ProjectRole[],
) {
  if (!allowedRoles.includes(role)) {
    throw new ForbiddenException(
      'You do not have permission to perform this action.',
    );
  }
}
