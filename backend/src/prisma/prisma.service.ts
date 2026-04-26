import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    await this.verifyProtocolConfig();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async verifyProtocolConfig() {
    const config = await this.protocolConfig.findUnique({ where: { id: 1 } });

    if (!config) {
      throw new Error('ProtocolConfig row is missing. Run `yarn prisma:seed`.');
    }
  }
}
