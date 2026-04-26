import { Body, Controller, Inject, Post } from '@nestjs/common';
import { DepositEventDto } from './dto/deposit-event.dto';
import { VaultMultChangedEventDto } from './dto/vault-mult-changed-event.dto';
import { WithdrawEventDto } from './dto/withdraw-event.dto';
import { PointsService } from './points.service';

@Controller('v1/events')
export class EventsController {
  constructor(
    @Inject(PointsService)
    private readonly pointsService: PointsService,
  ) {}

  @Post('deposit')
  deposit(@Body() dto: DepositEventDto) {
    return this.pointsService.processDeposit(dto);
  }

  @Post('withdraw')
  withdraw(@Body() dto: WithdrawEventDto) {
    return this.pointsService.processWithdraw(dto);
  }

  @Post('vault-mult-changed')
  changeVaultMult(@Body() dto: VaultMultChangedEventDto) {
    return this.pointsService.processVaultMultChanged(dto);
  }
}
