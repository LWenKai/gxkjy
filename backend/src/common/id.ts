import { BadRequestException } from '@nestjs/common';

export function parseBigIntId(value: string, field = 'id') {
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException({
      message: `${field} must be a positive integer`,
      code: 'INVALID_ID',
    });
  }

  return BigInt(value);
}
