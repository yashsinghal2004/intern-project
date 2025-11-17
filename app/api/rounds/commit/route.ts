import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateServerSeed, generateNonce, generateCommitHex } from '@/lib/crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const serverSeed = generateServerSeed();
    const nonce = generateNonce();
    const commitHex = generateCommitHex(serverSeed, nonce);

    const round = await prisma.round.create({
      data: {
        status: 'CREATED',
        nonce,
        commitHex,
        serverSeed,
        clientSeed: '',
        combinedSeed: '',
        pegMapHash: '',
        rows: 12,
        dropColumn: 0,
        binIndex: 0,
        payoutMultiplier: 0,
        betCents: 0,
        pathJson: '[]',
      },
    });

    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}

