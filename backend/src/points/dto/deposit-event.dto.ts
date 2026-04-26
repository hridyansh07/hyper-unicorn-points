import { EntryPoint } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsString,
  Max,
  Min,
  NotEquals,
} from 'class-validator';
import { EventBaseDto } from './common.dto';

export class DepositEventDto extends EventBaseDto {
  @IsString()
  userAddress: string;

  @IsEnum(EntryPoint)
  entrypoint: EntryPoint;

  @IsString()
  sourceId: string;

  @IsString()
  sourceAsset: string;

  @IsNumberString({ no_symbols: true })
  @NotEquals('0')
  sourceQuantityRaw: string;

  @IsInt()
  @Min(0)
  @Max(255)
  sourceDecimals: number;

  @IsNumberString({ no_symbols: true })
  @NotEquals('0')
  principalUsdRaw: string;
}
