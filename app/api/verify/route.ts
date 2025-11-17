import { NextRequest, NextResponse } from 'next/server';
import { generateCommitHex, generateCombinedSeed } from '@/lib/crypto';
import { computePlinkoResult } from '@/lib/plinko-engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumnStr = searchParams.get('dropColumn');

    if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: serverSeed, clientSeed, nonce, dropColumn' },
        { status: 400 }
      );
    }

    const dropColumn = parseInt(dropColumnStr, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be between 0 and 12' },
        { status: 400 }
      );
    }

    const commitHex = generateCommitHex(serverSeed, nonce);
    const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
    const result = computePlinkoResult(combinedSeed, dropColumn);

    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash: result.pegMapHash,
      binIndex: result.binIndex,
      path: result.path,
      pegMap: result.pegMap,
    });
  } catch (error) {
    console.error('Error verifying:', error);
    return NextResponse.json(
      { error: 'Failed to verify' },
      { status: 500 }
    );
  }
}

