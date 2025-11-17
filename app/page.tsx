'use client';

import { useState, useEffect, useCallback } from 'react';
import PlinkoBoard from '@/components/PlinkoBoard';
import GameControls from '@/components/GameControls';
import { SoundManagerProvider, useSoundManager } from '@/components/SoundManager';
import { getPayoutMultiplier } from '@/lib/plinko-engine';
import confetti from 'canvas-confetti';
import Link from 'next/link';

function GameContent() {
  const [dropColumn, setDropColumn] = useState(6);
  const [betCents, setBetCents] = useState(100);
  const [clientSeed, setClientSeed] = useState('');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [commitHex, setCommitHex] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [recentBins, setRecentBins] = useState<number[]>([]);
  const [goldenBall, setGoldenBall] = useState(false);
  const [tiltMode, setTiltMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [secretTheme, setSecretTheme] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [completedRoundData, setCompletedRoundData] = useState<any>(null);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);

  const { playPegHit, playLanding } = useSoundManager();

  const payoutMultipliers = Array.from({ length: 13 }, (_, i) => getPayoutMultiplier(i));

  const createRound = useCallback(async () => {
    try {
      const response = await fetch('/api/rounds/commit', {
        method: 'POST',
      });
      const data = await response.json();
      setRoundId(data.roundId);
      setCommitHex(data.commitHex);
    } catch (error) {
      console.error('Error creating round:', error);
      alert('Failed to create round');
    }
  }, []);

  useEffect(() => {
    createRound();
  }, [createRound]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      setSecretInput((prev) => {
        const newInput = prev + e.key.toLowerCase();
        const trimmed = newInput.slice(-11);
        if (trimmed === 'open sesame') {
          setSecretTheme((prev) => !prev);
          return '';
        }
        return trimmed;
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setTiltMode((prev) => !prev);
      }
      if (e.key === 'g' || e.key === 'G') {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (recentBins.length >= 3) {
      const lastThree = recentBins.slice(-3);
      if (lastThree.every((bin) => bin === 6)) {
        setGoldenBall(true);
      } else {
        setGoldenBall(false);
      }
    } else {
      setGoldenBall(false);
    }
  }, [recentBins]);

  const handleDrop = async () => {
    if (!roundId || isDropping) return;

    setIsDropping(true);
    setCompletedRoundData(null);
    setShowVerificationDetails(false);

    try {
      const startResponse = await fetch(`/api/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed: clientSeed || `user-${Date.now()}`,
          betCents,
          dropColumn,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start round');
      }

      const startData = await startResponse.json();
      setCurrentRound(startData);
    } catch (error) {
      console.error('Error dropping ball:', error);
      alert('Failed to drop ball');
      setIsDropping(false);
    }
  };

  const handleAnimationComplete = async () => {
    if (!roundId || !currentRound) return;

    try {
      await fetch(`/api/rounds/${roundId}/reveal`, {
        method: 'POST',
      });

      const roundResponse = await fetch(`/api/rounds/${roundId}`);
      const roundData = await roundResponse.json();

      setCompletedRoundData(roundData);
      setRecentBins((prev) => [...prev, roundData.binIndex].slice(-3));

      const binCenter = {
        x: (dropColumn / 12) * 100,
        y: 50,
      };
      confetti({
        particleCount: 100,
        spread: 70,
        origin: binCenter,
        colors: ['#4299e1', '#48bb78', '#ed8936', '#9f7aea'],
      });

      playLanding();

      setTimeout(() => {
        createRound();
        setCurrentRound(null);
        setIsDropping(false);
      }, 1000);
    } catch (error) {
      console.error('Error completing round:', error);
      setIsDropping(false);
    }
  };

  const path = currentRound?.path || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '20px',
        background: secretTheme
          ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          : '#000000',
        color: secretTheme ? '#f7fafc' : '#ffffff',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header
          style={{
            textAlign: 'center',
            marginBottom: '30px',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: secretTheme ? '#ffd700' : '#fff',
            }}
          >
            {secretTheme ? '🏰 Plinko Dungeon 🏰' : '🎯 Plinko Game'}
          </h1>
          <div style={{ marginTop: '10px' }}>
            <Link
              href="/verify"
              style={{
                color: '#fff',
                textDecoration: 'underline',
              }}
            >
              Verifier
            </Link>
          </div>
        </header>

        {currentRound && (
          <>
            <PlinkoBoard
              rows={12}
              bins={13}
              path={path}
              dropColumn={dropColumn}
              binIndex={currentRound.binIndex}
              onAnimationComplete={handleAnimationComplete}
              isAnimating={isDropping}
              goldenBall={goldenBall}
              tiltMode={tiltMode}
              debugMode={debugMode}
              onPegHit={playPegHit}
              onLanding={playLanding}
            />

            <div
              style={{
                marginTop: '20px',
                marginBottom: '20px',
                padding: '16px 20px',
                background: 'rgba(159, 122, 234, 0.1)',
                border: '1px solid rgba(159, 122, 234, 0.3)',
                borderRadius: '12px',
                textAlign: 'center',
                maxWidth: '800px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                <span style={{ color: '#9f7aea' }}>Press</span>
                <kbd style={{ 
                  padding: '4px 10px', 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '6px', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#ffffff',
                }}>T</kbd>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>for TILT mode,</span>
                <kbd style={{ 
                  padding: '4px 10px', 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '6px', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#ffffff',
                }}>G</kbd>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>for debug grid</span>
                {goldenBall && (
                  <span style={{ 
                    marginLeft: '12px',
                    color: '#ffd700', 
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    ✨ Golden Ball Active! ✨
                  </span>
                )}
              </p>
            </div>
          </>
        )}

        <GameControls
          dropColumn={dropColumn}
          onDropColumnChange={setDropColumn}
          betCents={betCents}
          onBetCentsChange={setBetCents}
          clientSeed={clientSeed}
          onClientSeedChange={setClientSeed}
          onDrop={handleDrop}
          isDropping={isDropping}
          payoutMultipliers={payoutMultipliers}
        />

        {completedRoundData && (
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <p style={{ color: '#ffffff', fontSize: '16px' }}>
              <strong>Result:</strong> Bin {completedRoundData.binIndex} | Payout:{' '}
              {completedRoundData.payoutMultiplier}x | Win:{' '}
              {(betCents * completedRoundData.payoutMultiplier).toFixed(2)} cents
            </p>
            {completedRoundData.id && (
              <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Round ID: {completedRoundData.id}
              </p>
            )}
          </div>
        )}

        {completedRoundData && (
          <div
            style={{
              marginTop: '20px',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>Verification</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {showVerificationDetails && (
                <button
                  onClick={async () => {
                    const text = `Server Seed: ${completedRoundData.serverSeed || 'Not revealed yet'}\nClient Seed: ${completedRoundData.clientSeed}\nNonce: ${completedRoundData.nonce}\nDrop Column: ${completedRoundData.dropColumn}\nCommit Hex: ${completedRoundData.commitHex}`;
                    await navigator.clipboard.writeText(text);
                    alert('All details copied!');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(66, 153, 225, 0.2)',
                    color: '#4299e1',
                    border: '1px solid #4299e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(66, 153, 225, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(66, 153, 225, 0.2)';
                  }}
                >
                  Copy All
                </button>
                )}
                <button
                  onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(66, 153, 225, 0.2)',
                    color: '#4299e1',
                    border: '1px solid #4299e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(66, 153, 225, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(66, 153, 225, 0.2)';
                  }}
                >
                  {showVerificationDetails ? 'Hide' : 'Show'} Details
                </button>
                {showVerificationDetails && completedRoundData.serverSeed && (
                  <Link
                    href={`/verify?roundId=${completedRoundData.id}`}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(66, 153, 225, 0.2)',
                      color: '#4299e1',
                      border: '1px solid #4299e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(66, 153, 225, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(66, 153, 225, 0.2)';
                    }}
                  >
                    Verify Now
                  </Link>
                )}
              </div>
            </div>

            {showVerificationDetails && (
              <div style={{ marginTop: '15px', display: 'grid', gap: '12px' }}>
                {completedRoundData.serverSeed && (
                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '14px' }}>Server Seed</strong>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(completedRoundData.serverSeed);
                          alert('Copied!');
                        }}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(66, 153, 225, 0.2)',
                          color: '#4299e1',
                          border: '1px solid #4299e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <code style={{ 
                      display: 'block', 
                      padding: '10px', 
                      background: 'rgba(0, 0, 0, 0.3)', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      wordBreak: 'break-all',
                      color: '#4299e1',
                      cursor: 'pointer',
                      userSelect: 'all',
                      border: '1px solid rgba(66, 153, 225, 0.2)',
                      fontFamily: 'monospace',
                    }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(completedRoundData.serverSeed);
                      alert('Copied!');
                    }}
                    >
                      {completedRoundData.serverSeed}
                    </code>
                  </div>
                )}

                <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>Client Seed</strong>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(completedRoundData.clientSeed);
                        alert('Copied!');
                      }}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(66, 153, 225, 0.2)',
                        color: '#4299e1',
                        border: '1px solid #4299e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <code style={{ 
                    display: 'block', 
                    padding: '10px', 
                    background: 'rgba(0, 0, 0, 0.3)', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    userSelect: 'all',
                    color: '#4299e1',
                    border: '1px solid rgba(66, 153, 225, 0.2)',
                  }}
                  onClick={async () => {
                    await navigator.clipboard.writeText(completedRoundData.clientSeed);
                    alert('Copied!');
                  }}
                  >
                    {completedRoundData.clientSeed}
                  </code>
                </div>

                <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>Nonce</strong>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(completedRoundData.nonce);
                        alert('Copied!');
                      }}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(66, 153, 225, 0.2)',
                        color: '#4299e1',
                        border: '1px solid #4299e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <code style={{ 
                    display: 'block', 
                    padding: '10px', 
                    background: 'rgba(0, 0, 0, 0.3)', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    userSelect: 'all',
                    color: '#4299e1',
                    border: '1px solid rgba(66, 153, 225, 0.2)',
                  }}
                  onClick={async () => {
                    await navigator.clipboard.writeText(completedRoundData.nonce);
                    alert('Copied!');
                  }}
                  >
                    {completedRoundData.nonce}
                  </code>
                </div>

                <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>Drop Column</strong>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>{completedRoundData.dropColumn}</span>
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>Commit Hex</strong>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(completedRoundData.commitHex);
                        alert('Copied!');
                      }}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(66, 153, 225, 0.2)',
                        color: '#4299e1',
                        border: '1px solid #4299e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <code style={{ 
                    display: 'block', 
                    padding: '10px', 
                    background: 'rgba(0, 0, 0, 0.3)', 
                    borderRadius: '6px',
                    fontSize: '11px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    userSelect: 'all',
                    color: '#4299e1',
                    border: '1px solid rgba(66, 153, 225, 0.2)',
                  }}
                  onClick={async () => {
                    await navigator.clipboard.writeText(completedRoundData.commitHex);
                    alert('Copied!');
                  }}
                  >
                    {completedRoundData.commitHex}
                  </code>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SoundManagerProvider>
      <GameContent />
    </SoundManagerProvider>
  );
}

