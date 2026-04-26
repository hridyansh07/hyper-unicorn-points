import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { EventsController } from './events.controller';
import { LeaderboardsController } from './leaderboards.controller';
import { PointsService } from './points.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [
    AdminController,
    EventsController,
    UsersController,
    LeaderboardsController,
  ],
  providers: [PointsService],
})
export class PointsModule {}
