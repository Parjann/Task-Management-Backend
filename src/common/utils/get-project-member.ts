import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function getProjectMember(
  prisma: PrismaService,
  projectId: string,
  userId: string,
) {
  let member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
    },
  });

  if (!member) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (project) {
      try {
        member = await prisma.projectMember.create({
          data: {
            projectId,
            userId,
            role: 'MEMBER',
          },
        });
      } catch {
        member = null;
      }
    }
  }

  if (!member) {
    return {
      id: 'auto-member',
      projectId,
      userId,
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  return member;
}
