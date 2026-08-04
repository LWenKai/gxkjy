import { randomBytes } from 'crypto';

export function generateTemporaryPassword() {
  return `Gx${randomBytes(4).toString('hex')}@26`;
}

export function generateAccessSecret() {
  return randomBytes(24).toString('hex');
}

export function maskSecret(secret: string) {
  if (secret.length <= 8) {
    return '********';
  }

  return `${secret.slice(0, 4)}****${secret.slice(-4)}`;
}
