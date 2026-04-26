import { IsISO8601 } from 'class-validator';

export class EventBaseDto {
  @IsISO8601()
  occurredAt: string;
}
