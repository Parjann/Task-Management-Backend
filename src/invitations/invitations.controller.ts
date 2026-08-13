import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('projects/:projectId/invitations')
  @ApiOperation({
    summary: 'Invite member to project by email',
  })
  create(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.id, projectId, dto);
  }

  @Get('projects/:projectId/invitations')
  @ApiOperation({
    summary: 'Get all invitations for a project',
  })
  findAllByProject(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    return this.invitationsService.findAllByProject(user.id, projectId);
  }

  @Get('invitations/:token')
  @ApiOperation({
    summary: 'Get invitation details by token',
  })
  getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({
    summary: 'Accept invitation',
  })
  accept(@CurrentUser() user: { id: string }, @Param('token') token: string) {
    return this.invitationsService.accept(user.id, token);
  }

  @Post('invitations/:token/reject')
  @ApiOperation({
    summary: 'Reject invitation',
  })
  reject(@CurrentUser() user: { id: string }, @Param('token') token: string) {
    return this.invitationsService.reject(user.id, token);
  }

  @Delete('invitations/:id')
  @ApiOperation({
    summary: 'Cancel / delete invitation',
  })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.invitationsService.remove(user.id, id);
  }
}
