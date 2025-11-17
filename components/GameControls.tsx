'use client';

import { useState, useEffect } from 'react';
import { useSoundManager } from './SoundManager';

interface GameControlsProps {
  dropColumn: number;
  onDropColumnChange: (column: number) => void;
  betCents: number;
  onBetCentsChange: (cents: number) => void;
  clientSeed: string;
  onClientSeedChange: (seed: string) => void;
  onDrop: () => void;
  isDropping: boolean;
  payoutMultipliers: number[];
}

export default function GameControls({
  dropColumn,
  onDropColumnChange,
  betCents,
  onBetCentsChange,
  clientSeed,
  onClientSeedChange,
  onDrop,
  isDropping,
  payoutMultipliers,
}: GameControlsProps) {
  const { isMuted, toggleMute } = useSoundManager();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isDropping) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onDropColumnChange(Math.max(0, dropColumn - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onDropColumnChange(Math.min(12, dropColumn + 1));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isDropping) {
          onDrop();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dropColumn, onDropColumnChange, onDrop, isDropping]);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '800px',
        margin: '0 auto',
        backdropFilter: 'blur(10px)',
      }}
    >
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
          Drop Column: {dropColumn}
        </label>
        <input
          type="range"
          min="0"
          max="12"
          value={dropColumn}
          onChange={(e) => onDropColumnChange(parseInt(e.target.value, 10))}
          style={{ 
            width: '100%',
            accentColor: '#4299e1',
          }}
          disabled={isDropping}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '4px',
          }}
        >
          <span>0</span>
          <span>6 (center)</span>
          <span>12</span>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px' }}>
          Use ← → arrow keys or A/D to adjust
        </div>
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
          Bet Amount (cents):
        </label>
        <input
          type="number"
          min="1"
          value={betCents}
          onChange={(e) => onBetCentsChange(parseInt(e.target.value, 10) || 1)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontSize: '16px',
          }}
          disabled={isDropping}
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
          Client Seed (optional):
        </label>
        <input
          type="text"
          value={clientSeed}
          onChange={(e) => onClientSeedChange(e.target.value)}
          placeholder="Enter your seed or leave empty"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontSize: '16px',
          }}
          disabled={isDropping}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={onDrop}
          disabled={isDropping}
          style={{
            flex: 1,
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '600',
            background: isDropping 
              ? 'rgba(160, 174, 192, 0.3)' 
              : 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: isDropping ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isDropping ? 'none' : '0 4px 12px rgba(66, 153, 225, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!isDropping) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(66, 153, 225, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDropping) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.3)';
            }
          }}
        >
          {isDropping ? 'Dropping...' : 'Drop Ball (Space)'}
        </button>
        <button
          onClick={toggleMute}
          style={{
            padding: '14px',
            fontSize: '20px',
            background: isMuted 
              ? 'rgba(252, 129, 129, 0.2)' 
              : 'rgba(72, 187, 120, 0.2)',
            color: 'white',
            border: `1px solid ${isMuted ? '#fc8181' : '#48bb78'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Payout Table */}
      <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
          Payout Multipliers
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          {payoutMultipliers.map((mult, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                padding: '10px',
                background: index === 6 
                  ? 'rgba(254, 215, 215, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${index === 6 ? 'rgba(254, 215, 215, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '8px',
                fontWeight: index === 0 || index === 12 ? '600' : 'normal',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = index === 6 
                  ? 'rgba(254, 215, 215, 0.25)' 
                  : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = index === 6 
                  ? 'rgba(254, 215, 215, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>Bin {index}</div>
              <div style={{ color: '#4299e1', fontWeight: '500' }}>{mult}x</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

