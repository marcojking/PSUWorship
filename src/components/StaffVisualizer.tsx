'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Note } from '@/lib/music/melodyGenerator';
import { midiToNoteName } from '@/lib/music/theory';

interface StaffVisualizerProps {
  melody: Note[];
  harmony: Note[];
  tempo: number;
  currentBeat: number;
  userPitch: number | null;
  userPitchHistory: Array<{ midi: number; timestamp: number }>;
  isPlaying: boolean;
}

// Staff configuration - ZOOMED IN
const STAFF_CONFIG = {
  lineSpacing: 28,          // Bigger spacing between lines
  noteWidth: 16,            // Bigger note heads
  nowLinePercent: 0.3,      // Now-line position
  beatsVisible: 8,          // Fewer beats = more zoom
};

// MIDI to staff position (diatonic, not chromatic)
// Returns vertical offset from staff center (middle line = B4) in pixels
// Staff lines: E4 (bottom), G4, B4 (middle), D5, F5 (top)
function getMidiStaffPosition(midi: number, lineSpacing: number): number {
  // Semitone offsets for natural notes within octave (C=0)
  const naturalNoteOffsets = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

  // Get octave and semitone within octave
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;

  // Find the natural note index (0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B)
  let noteIndex = 0;
  for (let i = 0; i < naturalNoteOffsets.length; i++) {
    if (semitone >= naturalNoteOffsets[i]) {
      noteIndex = i;
    }
  }

  // Calculate diatonic steps from middle line (B4)
  // B4 is octave 4, note index 6
  const b4Octave = 4;
  const b4NoteIndex = 6;

  const octaveDiff = octave - b4Octave;
  const noteDiff = noteIndex - b4NoteIndex;

  // Each octave = 7 diatonic steps
  const stepsFromMiddle = octaveDiff * 7 + noteDiff;

  // Convert to pixels: each step = half line spacing
  // Positive steps (higher notes) go up (negative Y)
  return -stepsFromMiddle * (lineSpacing / 2);
}

// Accuracy color
function getAccuracyColor(centsDiff: number): string {
  const absDiff = Math.abs(centsDiff);
  if (absDiff < 15) return '#4ade80';  // Green
  if (absDiff < 30) return '#a3e635';  // Lime
  if (absDiff < 50) return '#facc15';  // Yellow
  if (absDiff < 100) return '#fb923c'; // Orange
  return '#f87171';                     // Red
}

export default function StaffVisualizer({
  melody,
  harmony,
  tempo,
  currentBeat,
  userPitch,
  userPitchHistory,
  isPlaying,
}: StaffVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Handle DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background - cream
    ctx.fillStyle = '#fff1dc';
    ctx.fillRect(0, 0, width, height);

    // Staff dimensions
    const staffHeight = STAFF_CONFIG.lineSpacing * 4;
    const staffTop = (height - staffHeight) / 2;  // Center vertically
    const staffCenter = staffTop + staffHeight / 2;
    const nowLineX = width * STAFF_CONFIG.nowLinePercent;
    const pixelsPerBeat = (width * 0.9) / STAFF_CONFIG.beatsVisible;

    // Draw staff lines - brand color
    ctx.strokeStyle = '#1b354e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * STAFF_CONFIG.lineSpacing;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Treble clef - bigger
    ctx.fillStyle = '#1b354e';
    ctx.font = `${STAFF_CONFIG.lineSpacing * 4}px serif`;
    ctx.fillText('𝄞', 50, staffTop + staffHeight + STAFF_CONFIG.lineSpacing * 0.5);

    // Now-line - prominent glow effect
    ctx.shadowColor = '#1b354e';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#1b354e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(nowLineX, staffTop - 40);
    ctx.lineTo(nowLineX, staffTop + staffHeight + 40);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Position helpers
    const getX = (beat: number) => nowLineX + (beat - currentBeat) * pixelsPerBeat;
    const getY = (midi: number) => staffCenter + getMidiStaffPosition(midi, STAFF_CONFIG.lineSpacing);

    // Draw note function
    const drawNote = (note: Note, color: string, alpha: number = 1, filled: boolean = true) => {
      const x = getX(note.startBeat);
      const y = getY(note.midi);

      if (x < -50 || x > width + 50) return;

      ctx.globalAlpha = alpha;

      // Draw ledger lines first
      ctx.strokeStyle = '#1b354e';
      ctx.lineWidth = 2;

      // Above staff
      if (y < staffTop - STAFF_CONFIG.lineSpacing / 2) {
        for (let ly = staffTop - STAFF_CONFIG.lineSpacing; ly > y - STAFF_CONFIG.lineSpacing / 2; ly -= STAFF_CONFIG.lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(x - STAFF_CONFIG.noteWidth - 8, ly);
          ctx.lineTo(x + STAFF_CONFIG.noteWidth + 8, ly);
          ctx.stroke();
        }
      }

      // Below staff
      if (y > staffTop + staffHeight + STAFF_CONFIG.lineSpacing / 2) {
        for (let ly = staffTop + staffHeight + STAFF_CONFIG.lineSpacing; ly < y + STAFF_CONFIG.lineSpacing / 2; ly += STAFF_CONFIG.lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(x - STAFF_CONFIG.noteWidth - 8, ly);
          ctx.lineTo(x + STAFF_CONFIG.noteWidth + 8, ly);
          ctx.stroke();
        }
      }

      // Note head
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, STAFF_CONFIG.noteWidth, STAFF_CONFIG.noteWidth * 0.75, -0.2, 0, Math.PI * 2);

      if (filled) {
        ctx.fill();
      } else {
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    // Draw harmony notes (ghost outline)
    for (const note of harmony) {
      drawNote(note, '#3a5a7a', 0.6, false);
    }

    // Draw melody notes (solid main color)
    for (const note of melody) {
      drawNote(note, '#1b354e', 1, true);
    }

    // User pitch trail
    if (userPitchHistory.length > 1) {
      const now = performance.now();

      for (let i = 1; i < userPitchHistory.length; i++) {
        const prev = userPitchHistory[i - 1];
        const curr = userPitchHistory[i];

        const prevAge = (now - prev.timestamp) / 1000;
        const currAge = (now - curr.timestamp) / 1000;

        const prevX = nowLineX - prevAge * (tempo / 60) * pixelsPerBeat;
        const currX = nowLineX - currAge * (tempo / 60) * pixelsPerBeat;

        if (currX < 0 || prevX < 0) continue;

        const prevY = getY(prev.midi);
        const currY = getY(curr.midi);

        // Find target harmony note
        const beatAtPoint = currentBeat - currAge * (tempo / 60);
        const targetNote = harmony.find(
          n => n.startBeat <= beatAtPoint && n.startBeat + n.duration > beatAtPoint
        );

        let color = '#1b354e';
        if (targetNote) {
          const centsDiff = (curr.midi - targetNote.midi) * 100;
          color = getAccuracyColor(centsDiff);
        }

        ctx.globalAlpha = Math.max(0.1, 1 - currAge / 1.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // Current user pitch marker
    if (userPitch !== null && userPitch > 0) {
      const y = getY(userPitch);
      const clampedY = Math.max(staffTop - 60, Math.min(staffTop + staffHeight + 60, y));
      const isOutOfRange = Math.abs(y - clampedY) > 1;

      const targetNote = harmony.find(
        n => n.startBeat <= currentBeat && n.startBeat + n.duration > currentBeat
      );

      let color = '#4ade80';
      if (targetNote) {
        const centsDiff = (userPitch - targetNote.midi) * 100;
        color = getAccuracyColor(centsDiff);
      }

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(nowLineX, clampedY, STAFF_CONFIG.noteWidth + 4, (STAFF_CONFIG.noteWidth + 4) * 0.75, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Arrow if out of range
      if (isOutOfRange) {
        ctx.fillStyle = '#1b354e';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(y < clampedY ? '▲' : '▼', nowLineX, clampedY + 6);
      }

      // Note label
      ctx.fillStyle = '#1b354e';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(midiToNoteName(Math.round(userPitch)), nowLineX + STAFF_CONFIG.noteWidth + 12, clampedY + 6);
    }


  }, [melody, harmony, tempo, currentBeat, userPitch, userPitchHistory, isPlaying]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
