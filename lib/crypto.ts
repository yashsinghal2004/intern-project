import { createHash } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateCommitHex(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}

export function generateCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

export function generateServerSeed(): string {
  const bytes = new Uint8Array(32);
  if (typeof window === 'undefined') {
    const crypto = require('crypto');
    crypto.randomFillSync(bytes);
  } else {
    crypto.getRandomValues(bytes);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateNonce(): string {
  if (typeof window === 'undefined') {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  } else {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

