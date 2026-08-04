import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';

export function isPrismaUniqueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function throwConflict(message: string, code: string): never {
  throw new ConflictException({
    message,
    code,
  });
}
