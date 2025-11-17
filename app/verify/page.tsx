'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PlinkoBoard from '@/components/PlinkoBoard';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const roundIdFromUrl = searchParams.get('roundId');
  
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [dropColumn, setDropColumn] = useState(6);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [roundData, setRoundData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAutoVerified, setIsAutoVerified] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  const handleVerifyByRoundId = async (roundIdParam?: string) => {
    const roundId = roundIdParam || prompt('Enter Round ID:');
    if (!roundId) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/rounds/${roundId}`);
      if (!response.ok) {
        throw new Error('Round not found');
      }

      const round = await response.json();
      setRoundData(round);

      const verifyResponse = await fetch(
        `/api/verify?serverSeed=${encodeURIComponent(round.serverSeed || '')}&clientSeed=${encodeURIComponent(round.clientSeed)}&nonce=${encodeURIComponent(round.nonce)}&dropColumn=${round.dropColumn}`
      );

      if (!verifyResponse.ok) {
        throw new Error('Verification failed');
      }

      const verifyData = await verifyResponse.json();
      setVerificationResult(verifyData);
      setServerSeed(round.serverSeed || '');
      setClientSeed(round.clientSeed);
      setNonce(round.nonce);
      setDropColumn(round.dropColumn);
      setIsAutoVerified(!!roundIdParam); // Mark as auto-verified if loaded from URL
    } catch (err: any) {
      setError(err.message || 'Failed to verify round');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (roundIdFromUrl) {
      handleVerifyByRoundId(roundIdFromUrl);
    }
  }, [roundIdFromUrl]);

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !nonce) {
      setError('Please fill in all required fields');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setIsAutoVerified(false); // Manual verification

    try {
      const response = await fetch(
        `/api/verify?serverSeed=${encodeURIComponent(serverSeed)}&clientSeed=${encodeURIComponent(clientSeed)}&nonce=${encodeURIComponent(nonce)}&dropColumn=${dropColumn}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setVerificationResult(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const path = verificationResult?.path || [];
  const binIndex = verificationResult?.binIndex;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '20px',
        background: '#000000',
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
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>
            🔍 Verifier
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#fff', opacity: 0.9 }}>
            Verify the fairness of any Plinko round
          </p>
          <div style={{ marginTop: '10px' }}>
            <a
              href="/"
              style={{
                color: '#fff',
                textDecoration: 'underline',
              }}
            >
              ← Back to Game
            </a>
          </div>
        </header>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '800px',
            margin: '0 auto 30px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => handleVerifyByRoundId()}
              style={{
                padding: '10px 20px',
                background: 'rgba(66, 153, 225, 0.2)',
                color: '#4299e1',
                border: '1px solid #4299e1',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px',
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
              Verify by Round ID
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              Server Seed:
            </label>
            <input
              type="text"
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              placeholder="Enter server seed (revealed after round)"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              Client Seed:
            </label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              placeholder="Enter client seed"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              Nonce:
            </label>
            <input
              type="text"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              placeholder="Enter nonce"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              Drop Column (0-12):
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={dropColumn}
              onChange={(e) => setDropColumn(parseInt(e.target.value, 10) || 0)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '15px',
                background: 'rgba(197, 48, 48, 0.2)',
                color: '#fc8181',
                border: '1px solid rgba(197, 48, 48, 0.4)',
                borderRadius: '10px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {isAutoVerified && verificationResult && (
            <div
              style={{
                padding: '15px',
                background: '#c6f6d5',
                color: '#22543d',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              ✅ <strong>Auto-verified!</strong>
            </div>
          )}

          {!verificationResult && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              style={{
                width: '100%',
                padding: '14px',
                background: isVerifying 
                  ? 'rgba(160, 174, 192, 0.3)' 
                  : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: isVerifying ? 'none' : '0 4px 12px rgba(72, 187, 120, 0.3)',
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          )}

          {verificationResult && !isAutoVerified && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              style={{
                width: '100%',
                padding: '14px',
                background: isVerifying 
                  ? 'rgba(160, 174, 192, 0.3)' 
                  : 'rgba(66, 153, 225, 0.2)',
                color: isVerifying ? 'rgba(255, 255, 255, 0.5)' : '#4299e1',
                border: isVerifying ? 'none' : '1px solid #4299e1',
                borderRadius: '10px',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '10px',
                transition: 'all 0.2s',
              }}
            >
              {isVerifying ? 'Re-verifying...' : 'Re-verify'}
            </button>
          )}
        </div>

        {verificationResult && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '800px',
            margin: '0 auto 30px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h2 style={{ marginBottom: '20px', color: '#ffffff', fontWeight: '600' }}>Verification Result</h2>

            {roundData && (
              <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
                <h3 style={{ marginBottom: '10px', color: '#ffffff', fontWeight: '600' }}>Round Data</h3>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.8)' }}>
                  <p><strong>Round ID:</strong> {roundData.id}</p>
                  <p><strong>Status:</strong> {roundData.status}</p>
                  <p><strong>Bin Index:</strong> {roundData.binIndex}</p>
                  <p><strong>Peg Map Hash:</strong> {roundData.pegMapHash}</p>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#ffffff', fontWeight: '600' }}>Computed Values</h3>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>Commit Hex:</strong>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(verificationResult.commitHex);
                        alert('Commit Hex copied!');
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
                      📋 Copy
                    </button>
                  </div>
                  <code style={{ 
                    display: 'block', 
                    wordBreak: 'break-all', 
                    cursor: 'pointer', 
                    userSelect: 'all',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    color: '#4299e1',
                    border: '1px solid rgba(66, 153, 225, 0.2)',
                    marginBottom: '12px',
                  }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(verificationResult.commitHex);
                      alert('Commit Hex copied!');
                    }}
                  >
                    {verificationResult.commitHex}
                  </code>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>Combined Seed:</strong>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(verificationResult.combinedSeed);
                        alert('Combined Seed copied!');
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
                      📋 Copy
                    </button>
                  </div>
                  <code style={{ 
                    display: 'block', 
                    wordBreak: 'break-all', 
                    cursor: 'pointer', 
                    userSelect: 'all',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    color: '#4299e1',
                    border: '1px solid rgba(66, 153, 225, 0.2)',
                  }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(verificationResult.combinedSeed);
                      alert('Combined Seed copied!');
                    }}
                  >
                    {verificationResult.combinedSeed}
                  </code>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>Peg Map Hash:</strong>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(verificationResult.pegMapHash);
                        alert('Peg Map Hash copied!');
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
                      📋 Copy
                    </button>
                  </div>
                  <code style={{ 
                    display: 'block', 
                    wordBreak: 'break-all', 
                    cursor: 'pointer', 
                    userSelect: 'all',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    color: '#4299e1',
                    border: '1px solid rgba(66, 153, 225, 0.2)',
                  }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(verificationResult.pegMapHash);
                      alert('Peg Map Hash copied!');
                    }}
                  >
                    {verificationResult.pegMapHash}
                  </code>
                </div>
                <div style={{ color: '#ffffff' }}>
                  <strong>Bin Index:</strong> {verificationResult.binIndex}
                </div>
              </div>
            </div>

            {roundData && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '16px', 
                borderRadius: '10px', 
                background: roundData.pegMapHash === verificationResult.pegMapHash && roundData.binIndex === verificationResult.binIndex 
                  ? 'rgba(72, 187, 120, 0.1)' 
                  : 'rgba(197, 48, 48, 0.1)',
                border: `1px solid ${roundData.pegMapHash === verificationResult.pegMapHash && roundData.binIndex === verificationResult.binIndex 
                  ? 'rgba(72, 187, 120, 0.3)' 
                  : 'rgba(197, 48, 48, 0.3)'}`,
              }}>
                <h3 style={{ marginBottom: '10px', color: '#ffffff', fontWeight: '600' }}>Verification Status</h3>
                {roundData.pegMapHash === verificationResult.pegMapHash && roundData.binIndex === verificationResult.binIndex ? (
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#48bb78' }}>
                    ✅ Verified! All values match.
                  </p>
                ) : (
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#fc8181' }}>
                    ❌ Verification failed! Values do not match.
                  </p>
                )}
              </div>
            )}

            {binIndex !== undefined && path.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, color: '#ffffff', fontWeight: '600' }}>Replay Visualization</h3>
                  {!isReplaying && (
                    <button
                      onClick={() => setIsReplaying(true)}
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
                      ▶️ Replay Animation
                    </button>
                  )}
                </div>
                <PlinkoBoard
                  rows={12}
                  bins={13}
                  path={path}
                  dropColumn={dropColumn}
                  binIndex={binIndex}
                  onAnimationComplete={() => setIsReplaying(false)}
                  isAnimating={isReplaying}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

