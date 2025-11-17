'use client';

import { useEffect, useRef, useState } from 'react';
import { PathDecision } from '@/lib/plinko-engine';

interface PlinkoBoardProps {
  rows: number;
  bins: number;
  path: PathDecision[];
  dropColumn: number;
  binIndex: number;
  onAnimationComplete: () => void;
  isAnimating: boolean;
  goldenBall?: boolean;
  tiltMode?: boolean;
  debugMode?: boolean;
  onPegHit?: () => void;
  onLanding?: () => void;
}

const PEG_RADIUS = 8;
const BALL_RADIUS = 10;
const ROW_HEIGHT = 50;
const BIN_WIDTH = 60;
const BOARD_PADDING = 40;

export default function PlinkoBoard({
  rows,
  bins,
  path,
  dropColumn,
  binIndex,
  onAnimationComplete,
  isAnimating,
  goldenBall = false,
  tiltMode = false,
  debugMode = false,
  onPegHit,
  onLanding,
}: PlinkoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const animationStateRef = useRef<{
    rowIndex: number;
    animationTime: number;
    ballStartX: number;
    ballStartY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const tiltModeRef = useRef(tiltMode);
  const debugModeRef = useRef(debugMode);
  const goldenBallRef = useRef(goldenBall);
  const onPegHitRef = useRef(onPegHit);
  const onLandingRef = useRef(onLanding);

  useEffect(() => {
    tiltModeRef.current = tiltMode;
    debugModeRef.current = debugMode;
    goldenBallRef.current = goldenBall;
    onPegHitRef.current = onPegHit;
    onLandingRef.current = onLanding;
  }, [tiltMode, debugMode, goldenBall, onPegHit, onLanding]);

  const lastPathRef = useRef(path);
  const lastDropColumnRef = useRef(dropColumn);
  const lastBinIndexRef = useRef(binIndex);

  useEffect(() => {
    if (!isAnimating || !canvasRef.current) {
      animationStateRef.current = null;
      return;
    }

    const pathChanged = lastPathRef.current !== path;
    const dropColumnChanged = lastDropColumnRef.current !== dropColumn;
    const binIndexChanged = lastBinIndexRef.current !== binIndex;
    
    if (pathChanged || dropColumnChanged || binIndexChanged) {
      animationStateRef.current = null;
      lastPathRef.current = path;
      lastDropColumnRef.current = dropColumn;
      lastBinIndexRef.current = binIndex;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const boardWidth = bins * BIN_WIDTH;
    const boardHeight = rows * ROW_HEIGHT + 100;
    canvas.width = boardWidth + BOARD_PADDING * 2;
    canvas.height = boardHeight + BOARD_PADDING * 2;

    const pegs: { x: number; y: number; row: number; index: number }[] = [];
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 1;
      const rowY = BOARD_PADDING + r * ROW_HEIGHT + 30;
      const startX = (boardWidth - (pegsInRow - 1) * BIN_WIDTH) / 2 + BOARD_PADDING;
      for (let p = 0; p < pegsInRow; p++) {
        pegs.push({
          x: startX + p * BIN_WIDTH,
          y: rowY,
          row: r,
          index: p,
        });
      }
    }

    const binY = BOARD_PADDING + rows * ROW_HEIGHT + 50;
    const binStartX = BOARD_PADDING + (boardWidth - bins * BIN_WIDTH) / 2;

    if (!animationStateRef.current) {
      const ballStartX = binStartX + dropColumn * BIN_WIDTH + BIN_WIDTH / 2;
      const ballStartY = BOARD_PADDING;
      animationStateRef.current = {
        rowIndex: 0,
        animationTime: 0,
        ballStartX,
        ballStartY,
        currentX: ballStartX,
        currentY: ballStartY,
      };
    }

    const animationDuration = prefersReducedMotion ? 100 : 1000;

    const animate = () => {
      if (!ctx || !animationStateRef.current) return;

      const state = animationStateRef.current;
      let { rowIndex, animationTime, ballStartX, ballStartY, currentX, currentY } = state;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (tiltModeRef.current) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((Math.sin(Date.now() / 1000) * 5 * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.filter = 'sepia(20%) saturate(150%)';
      }

      pegs.forEach((peg) => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (debugModeRef.current) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText(`${peg.row},${peg.index}`, peg.x - 10, peg.y - 15);
        }
      });

      for (let i = 0; i < bins; i++) {
        const binX = binStartX + i * BIN_WIDTH;
        const isLandingBin = i === binIndex && rowIndex >= rows;
        ctx.fillStyle = isLandingBin 
          ? 'rgba(72, 187, 120, 0.4)' 
          : 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(binX, binY, BIN_WIDTH - 2, 30);
        ctx.strokeStyle = isLandingBin 
          ? 'rgba(72, 187, 120, 0.6)' 
          : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(binX, binY, BIN_WIDTH - 2, 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), binX + BIN_WIDTH / 2 - 1, binY + 20);
      }

      if (rowIndex < rows && path[rowIndex]) {
        const decision = path[rowIndex];
        const targetPeg = pegs.find(
          (p) => p.row === decision.row && p.index === decision.pegIndex
        );

        if (targetPeg) {
          const progress = Math.min(animationTime / animationDuration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          currentX = ballStartX + (targetPeg.x - ballStartX) * easeProgress;
          currentY = ballStartY + (targetPeg.y - ballStartY) * easeProgress;

          ctx.beginPath();
          ctx.arc(currentX, currentY, BALL_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = goldenBallRef.current ? '#ffd700' : '#4299e1';
          ctx.fill();
          ctx.strokeStyle = '#2b6cb0';
          ctx.lineWidth = 2;
          ctx.stroke();

          if (debugModeRef.current && progress > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(
              `rnd: ${decision.randomValue.toFixed(4)}`,
              currentX + 15,
              currentY - 10
            );
            ctx.fillText(
              `rnd: ${decision.randomValue.toFixed(4)}`,
              currentX + 15,
              currentY - 10
            );
            ctx.strokeText(
              `bias: ${decision.bias.toFixed(4)}`,
              currentX + 15,
              currentY
            );
            ctx.fillText(
              `bias: ${decision.bias.toFixed(4)}`,
              currentX + 15,
              currentY
            );
          }

          if (progress >= 1) {
            if (onPegHitRef.current) onPegHitRef.current();

            ballStartX = targetPeg.x;
            ballStartY = targetPeg.y;
            const direction = decision.decision === 'right' ? 1 : -1;
            ballStartX += direction * (BIN_WIDTH / 2);

            rowIndex++;
            animationTime = 0;
          } else {
            animationTime += 16;
          }
        }
      } else if (rowIndex >= rows) {
        const targetBinX = binStartX + binIndex * BIN_WIDTH + BIN_WIDTH / 2;
        const progress = Math.min(animationTime / (animationDuration / 2), 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        currentX = ballStartX + (targetBinX - ballStartX) * easeProgress;
        currentY = ballStartY + (binY - ballStartY) * easeProgress;

        ctx.beginPath();
        ctx.arc(currentX, currentY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = goldenBallRef.current ? '#ffd700' : '#4299e1';
        ctx.fill();
        ctx.strokeStyle = '#2b6cb0';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (progress >= 1) {
          if (onLandingRef.current) onLandingRef.current();
          onAnimationComplete();
          return;
        } else {
          animationTime += 16;
        }
      }

      if (tiltModeRef.current) {
        ctx.restore();
      }

      state.rowIndex = rowIndex;
      state.animationTime = animationTime;
      state.ballStartX = ballStartX;
      state.ballStartY = ballStartY;
      state.currentX = currentX;
      state.currentY = currentY;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, path, dropColumn, binIndex, rows, bins, onAnimationComplete]);

  useEffect(() => {
    if (isAnimating || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const boardWidth = bins * BIN_WIDTH;
    const boardHeight = rows * ROW_HEIGHT + 100;
    canvas.width = boardWidth + BOARD_PADDING * 2;
    canvas.height = boardHeight + BOARD_PADDING * 2;

    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 1;
      const rowY = BOARD_PADDING + r * ROW_HEIGHT + 30;
      const startX = (boardWidth - (pegsInRow - 1) * BIN_WIDTH) / 2 + BOARD_PADDING;
      for (let p = 0; p < pegsInRow; p++) {
        ctx.beginPath();
        ctx.arc(startX + p * BIN_WIDTH, rowY, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    const binY = BOARD_PADDING + rows * ROW_HEIGHT + 50;
    const binStartX = BOARD_PADDING + (boardWidth - bins * BIN_WIDTH) / 2;
    for (let i = 0; i < bins; i++) {
      const binX = binStartX + i * BIN_WIDTH;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(binX, binY, BIN_WIDTH - 2, 30);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(binX, binY, BIN_WIDTH - 2, 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i.toString(), binX + BIN_WIDTH / 2 - 1, binY + 20);
    }
  }, [isAnimating, rows, bins]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
        }}
      />
    </div>
  );
}

