import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCombinedSeed } from '@/lib/crypto';
import { computePlinkoResult, getPayoutMultiplier } from '@/lib/plinko-engine';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientSeed, betCents, dropColumn } = body;

    if (!clientSeed || typeof clientSeed !== 'string') {
      return NextResponse.json(
        { error: 'clientSeed is required' },
        { status: 400 }
      );
    }
    if (typeof betCents !== 'number' || betCents <= 0) {
      return NextResponse.json(
        { error: 'betCents must be a positive number' },
        { status: 400 }
      );
    }
    if (typeof dropColumn !== 'number' || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be between 0 and 12' },
        { status: 400 }
      );
    }

    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Round already started' },
        { status: 400 }
      );
    }

    if (!round.serverSeed) {
      return NextResponse.json(
        { error: 'Server seed not found' },
        { status: 500 }
      );
    }

    const combinedSeed = generateCombinedSeed(
      round.serverSeed,
      clientSeed,
      round.nonce
    );

    const result = computePlinkoResult(combinedSeed, dropColumn);
    const payoutMultiplier = getPayoutMultiplier(result.binIndex);

    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed,
        pegMapHash: result.pegMapHash,
        dropColumn,
        binIndex: result.binIndex,
        payoutMultiplier,
        betCents,
        pathJson: JSON.stringify(result.path),
      },
    });

    return NextResponse.json({
      roundId: updatedRound.id,
      pegMapHash: updatedRound.pegMapHash,
      rows: updatedRound.rows,
      binIndex: updatedRound.binIndex,
      payoutMultiplier: updatedRound.payoutMultiplier,
      path: result.path,
    });
  } catch (error) {
    console.error('Error starting round:', error);
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    );
  }
}

