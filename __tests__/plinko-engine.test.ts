import { computePlinkoResult, generatePegMap, calculatePath, getPayoutMultiplier } from '../lib/plinko-engine';
import { Xorshift32 } from '../lib/prng';
import { sha256 } from '../lib/crypto';

describe('Plinko Engine', () => {
  test('computePlinkoResult produces valid result', () => {
    const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const dropColumn = 6;
    const result = computePlinkoResult(combinedSeed, dropColumn);

    expect(result.binIndex).toBeGreaterThanOrEqual(0);
    expect(result.binIndex).toBeLessThanOrEqual(12);
    expect(result.path).toHaveLength(12);
    expect(result.pegMap.rows).toHaveLength(12);
    expect(result.pegMapHash).toHaveLength(64);
  });

  test('peg map generation is deterministic', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const prng1 = new Xorshift32(seed);
    const prng2 = new Xorshift32(seed);

    const map1 = generatePegMap(prng1);
    const map2 = generatePegMap(prng2);

    expect(JSON.stringify(map1)).toBe(JSON.stringify(map2));
  });

  test('peg map has correct structure', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const prng = new Xorshift32(seed);
    const pegMap = generatePegMap(prng);

    expect(pegMap.rows).toHaveLength(12);
    pegMap.rows.forEach((row, index) => {
      expect(row).toHaveLength(index + 1);
      row.forEach((peg) => {
        expect(peg.leftBias).toBeGreaterThanOrEqual(0.4);
        expect(peg.leftBias).toBeLessThanOrEqual(0.6);
      });
    });
  });

  test('Test vector: peg map first rows', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const prng = new Xorshift32(seed);
    const pegMap = generatePegMap(prng);

    // Check first row
    expect(pegMap.rows[0]).toHaveLength(1);
    expect(pegMap.rows[0][0].leftBias).toBeCloseTo(0.422123, 6);

    // Check second row
    expect(pegMap.rows[1]).toHaveLength(2);
    expect(pegMap.rows[1][0].leftBias).toBeCloseTo(0.552503, 6);
    expect(pegMap.rows[1][1].leftBias).toBeCloseTo(0.408786, 6);

    // Check third row
    expect(pegMap.rows[2]).toHaveLength(3);
    expect(pegMap.rows[2][0].leftBias).toBeCloseTo(0.491574, 6);
    expect(pegMap.rows[2][1].leftBias).toBeCloseTo(0.468780, 6);
    expect(pegMap.rows[2][2].leftBias).toBeCloseTo(0.436540, 6);
  });

  test('path calculation is deterministic', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const prng1 = new Xorshift32(seed);
    const prng2 = new Xorshift32(seed);
    const pegMap1 = generatePegMap(prng1);
    const pegMap2 = generatePegMap(prng2);

    const path1 = calculatePath(pegMap1, 6, prng1);
    const path2 = calculatePath(pegMap2, 6, prng2);

    expect(path1.binIndex).toBe(path2.binIndex);
    expect(JSON.stringify(path1.path)).toBe(JSON.stringify(path2.path));
  });

  test('drop column affects path', () => {
    const seed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    
    const result1 = computePlinkoResult(seed, 0);
    const result2 = computePlinkoResult(seed, 12);
    
    // Different drop columns should potentially produce different paths
    // (though not guaranteed due to randomness)
    expect(result1.path[0].bias).not.toBe(result2.path[0].bias);
  });

  test('payout multipliers are symmetric', () => {
    for (let i = 0; i <= 12; i++) {
      const mult = getPayoutMultiplier(i);
      const symmetricMult = getPayoutMultiplier(12 - i);
      expect(mult).toBe(symmetricMult);
    }
  });

  test('payout multiplier for center bin is lowest', () => {
    const centerMult = getPayoutMultiplier(6);
    const edgeMult = getPayoutMultiplier(0);
    expect(centerMult).toBeLessThan(edgeMult);
  });

  test('full round trip: same inputs produce same result', () => {
    const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const dropColumn = 6;

    const result1 = computePlinkoResult(combinedSeed, dropColumn);
    const result2 = computePlinkoResult(combinedSeed, dropColumn);

    expect(result1.binIndex).toBe(result2.binIndex);
    expect(result1.pegMapHash).toBe(result2.pegMapHash);
    expect(JSON.stringify(result1.path)).toBe(JSON.stringify(result2.path));
  });
});

