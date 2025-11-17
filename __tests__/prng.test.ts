import { Xorshift32, roundTo6Decimals } from '../lib/prng';

describe('Xorshift32 PRNG', () => {
  test('PRNG produces values in [0, 1) range', () => {
    const prng = new Xorshift32('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
    for (let i = 0; i < 100; i++) {
      const value = prng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test('PRNG is deterministic with same seed', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const prng1 = new Xorshift32(seed);
    const prng2 = new Xorshift32(seed);

    for (let i = 0; i < 10; i++) {
      expect(prng1.next()).toBe(prng2.next());
    }
  });

  test('Test vector: first 5 random values', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const prng = new Xorshift32(seed);
    
    const expected = [
      0.1106166649,
      0.7625129214,
      0.0439292176,
      0.4578678815,
      0.3438999297,
    ];

    for (let i = 0; i < 5; i++) {
      const value = prng.next();
      expect(value).toBeCloseTo(expected[i], 6);
    }
  });

  test('roundTo6Decimals rounds correctly', () => {
    expect(roundTo6Decimals(0.123456789)).toBe(0.123457);
    expect(roundTo6Decimals(0.5)).toBe(0.5);
    expect(roundTo6Decimals(0.1234564)).toBe(0.123456);
  });
});

