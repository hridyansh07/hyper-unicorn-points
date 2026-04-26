import { IsNumberString, NotEquals } from 'class-validator';
import { EventBaseDto } from './common.dto';

export class VaultMultChangedEventDto extends EventBaseDto {
  @IsNumberString({ no_symbols: true })
  @NotEquals('0')
  vaultMultRaw: string;
}
