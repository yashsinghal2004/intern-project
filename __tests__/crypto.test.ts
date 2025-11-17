import { sha256, generateCommitHex, generateCombinedSeed } from '../lib/crypto';

describe('Crypto functions', () => {
  test('SHA256 produces correct hash', () => {
    const input = 'test';
    const hash = sha256(input);
    expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });

  test('generateCommitHex produces correct format', () => {
    const serverSeed = 'test-seed';
    const nonce = '42';
    const commit = generateCommitHex(serverSeed, nonce);
    expect(commit).toHaveLength(64); // SHA256 hex string length
    expect(commit).toMatch(/^[0-9a-f]{64}$/);
  });

  test('generateCombinedSeed produces correct format', () => {
    const serverSeed = 'test-seed';
    const clientSeed = 'client-seed';
    const nonce = '42';
    const combined = generateCombinedSeed(serverSeed, clientSeed, nonce);
    expect(combined).toHaveLength(64);
    expect(combined).toMatch(/^[0-9a-f]{64}$/);
  });

  test('Test vector: commit hex', () => {
    const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
    const nonce = '42';
    const commitHex = generateCommitHex(serverSeed, nonce);
    expect(commitHex).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');
  });

  test('Test vector: combined seed', () => {
    const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
    const clientSeed = 'candidate-hello';
    const nonce = '42';
    const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
    expect(combinedSeed).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
  });
});

