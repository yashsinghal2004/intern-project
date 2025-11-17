export class Xorshift32 {
  private state: number;

  constructor(seed: string) {
    const seedHex = seed.substring(0, 8);
    this.state = parseInt(seedHex, 16) || 1;
    if (this.state === 0) this.state = 1;
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function roundTo6Decimals(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

