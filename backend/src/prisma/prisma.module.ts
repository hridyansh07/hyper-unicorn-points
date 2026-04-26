import { Global, Module } from '@nestjs/common';
import { PointsRepository } from './points.repository';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, PointsRepository],
  exports: [PrismaService, PointsRepository],
})
export class PrismaModule {}
