import { BadRequestException } from '@nestjs/common';
import { getAddress, isAddress } from 'viem';

export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw new BadRequestException(`Invalid EVM address: ${address}`);
  }

  return getAddress(address);
}
