import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { SubtasksModule } from './subtasks/subtasks.module';
import { CommentsModule } from './comments/comments.module';
import { LabelsModule } from './labels/labels.module';
import { ActivityModule } from './activity/activity.module';
import { PreferencesModule } from './preferences/preferences.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CalendarModule } from './calendar/calendar.module';
import { MailModule } from './mail/mail.module';
import { InvitationsModule } from './invitations/invitations.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    SubtasksModule,
    CommentsModule,
    LabelsModule,
    ActivityModule,
    PreferencesModule,
    DashboardModule,
    AttachmentsModule,
    NotificationsModule,
    SearchModule,
    WebsocketModule,
    CalendarModule,
    MailModule,
    InvitationsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
