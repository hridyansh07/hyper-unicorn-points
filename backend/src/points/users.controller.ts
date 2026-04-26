import { Controller, Get, Inject, Param } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('v1/users')
export class UsersController {
  constructor(
    @Inject(PointsService)
    private readonly pointsService: PointsService,
  ) {}

  @Get(':address/points')
  getPoints(@Param('address') address: string) {
    return this.pointsService.getUserPoints(address);
  }

  @Get(':address/shards')
  getShards(@Param('address') address: string) {
    return this.pointsService.getUserShards(address);
  }
}
