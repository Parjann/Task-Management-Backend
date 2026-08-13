import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FcmService } from './fcm.service';
import { RegisterTokenDto } from './dto/register-token.dto';

@ApiTags('FCM Push Notifications')
@ApiBearerAuth()
@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('register-token')
  @ApiOperation({
    summary: 'Register FCM device token for push notifications',
  })
  registerToken(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterTokenDto,
  ) {
    return this.fcmService.registerToken(user.id, dto.token);
  }

  @Delete('register-token')
  @ApiOperation({
    summary: 'Unregister FCM device token',
  })
  removeToken(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterTokenDto,
  ) {
    return this.fcmService.removeToken(user.id, dto.token);
  }

  @Post('test')
  @ApiOperation({
    summary: 'Send test push notification to registered devices',
  })
  sendTest(@CurrentUser() user: { id: string }) {
    return this.fcmService.sendTest(user.id);
  }
}
