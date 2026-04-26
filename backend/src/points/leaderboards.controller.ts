import { Controller, Get, Inject } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('v1/leaderboard')
export class LeaderboardsController {
  constructor(
    @Inject(PointsService)
    private readonly pointsService: PointsService,
  ) {}

  @Get()
  getLeaderboard() {
    return this.pointsService.getLeaderboard();
  }
}
