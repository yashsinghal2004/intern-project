import { Xorshift32, roundTo6Decimals } from './prng';
import { sha256 } from './crypto';

export interface Peg {
  leftBias: number;
}

export interface PegMap {
  rows: Peg[][];
}

export interface PathDecision {
  row: number;
  pegIndex: number;
  decision: 'left' | 'right';
  randomValue: number;
  bias: number;
}

export interface PlinkoResult {
  binIndex: number;
  pegMap: PegMap;
  pegMapHash: string;
  path: PathDecision[];
}

const ROWS = 12;
const BINS = 13;

export function generatePegMap(prng: Xorshift32): PegMap {
  const rows: Peg[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const rowPegs: Peg[] = [];
    for (let p = 0; p <= r; p++) {
      const rand = prng.next();
      const leftBias = roundTo6Decimals(0.5 + (rand - 0.5) * 0.2);
      rowPegs.push({ leftBias });
    }
    rows.push(rowPegs);
  }

  return { rows };
}

export function computePegMapHash(pegMap: PegMap): string {
  return sha256(JSON.stringify(pegMap));
}

export function calculatePath(
  pegMap: PegMap,
  dropColumn: number,
  prng: Xorshift32
): PlinkoResult {
  const path: PathDecision[] = [];
  let pos = 0;

  const centerColumn = Math.floor(ROWS / 2);
  const adj = (dropColumn - centerColumn) * 0.01;

  for (let r = 0; r < ROWS; r++) {
    const pegIndex = Math.min(pos, r);
    const peg = pegMap.rows[r][pegIndex];
    
    let bias = peg.leftBias + adj;
    bias = Math.max(0, Math.min(1, bias));

    const rnd = prng.next();
    const decision = rnd < bias ? 'left' : 'right';

    path.push({
      row: r,
      pegIndex,
      decision,
      randomValue: rnd,
      bias: roundTo6Decimals(bias),
    });

    if (decision === 'right') {
      pos += 1;
    }
  }

  const binIndex = pos;

  return {
    binIndex,
    pegMap,
    pegMapHash: computePegMapHash(pegMap),
    path,
  };
}

export function computePlinkoResult(
  combinedSeed: string,
  dropColumn: number
): PlinkoResult {
  if (dropColumn < 0 || dropColumn > 12) {
    throw new Error('dropColumn must be between 0 and 12');
  }

  const prng = new Xorshift32(combinedSeed);
  const pegMap = generatePegMap(prng);
  const result = calculatePath(pegMap, dropColumn, prng);

  return result;
}

export function getPayoutMultiplier(binIndex: number): number {
  const multipliers = [1000, 100, 26, 9, 4, 2, 0.2, 2, 4, 9, 26, 100, 1000];
  return multipliers[binIndex];
}

