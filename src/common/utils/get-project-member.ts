import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function getProjectMember(
  prisma: PrismaService,
  projectId: string,
  userId: string,
) {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
    },
  });

  if (!member) {
    throw new NotFoundException('Project not found or access denied');
  }

  return member;
}
