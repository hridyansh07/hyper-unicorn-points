import { Controller, Inject, Post } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('v1/admin')
export class AdminController {
  constructor(
    @Inject(PointsService)
    private readonly pointsService: PointsService,
  ) {}

  @Post('crystallize')
  crystallize() {
    return this.pointsService.crystallizeAllActiveShards(new Date());
  }
}
