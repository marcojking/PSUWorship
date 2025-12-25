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

// Staff configuration - responsive
const getStaffConfig = (width: number) => {
  const isMobile = width < 640;
  return {
    lineSpacing: isMobile ? 20 : 28,          // Smaller on mobile
    noteWidth: isMobile ? 12 : 16,            // Smaller note heads on mobile
    nowLinePercent: 0.3,                      // Now-line position
    beatsVisible: isMobile ? 6 : 8,           // Fewer beats on mobile = less crowded
    clefSize: isMobile ? 3 : 4,               // Smaller clef on mobile
    leftPadding: isMobile ? 30 : 40,          // Less padding on mobile
  };
};

// MIDI to staff position (diatonic, not chromatic)
// Returns vertical offset from staff center (middle line = B4) in pixels
// Staff lines: E4 (bottom), G4, B4 (middle), D5, F5 (top)
function getMidiStaffPosition(midi: number, lineSpacing: number): number {
  // Map semitone (0-11) to natural note index (0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B)
  // Accidentals are mapped to the NEAREST natural note for correct diatonic display
  // Flats (Db, Eb, Ab, Bb) map UP to their letter name
  // Sharps (C#, F#, G#) map DOWN to their letter name
  const semitoneToNaturalNote = [
    0, // 0: C
    1, // 1: C#/Db → D (round up for visual correctness in flat keys)
    1, // 2: D
    2, // 3: D#/Eb → E (Eb is more common, display on E line)
    2, // 4: E
    3, // 5: F
    3, // 6: F#/Gb → F (F# is more common, display on F line)
    4, // 7: G
    5, // 8: G#/Ab → A (Ab is more common, display on A space)
    5, // 9: A
    6, // 10: A#/Bb → B (Bb is more common, display on B line)
    6, // 11: B
  ];

  // Get octave and semitone within octave
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  const noteIndex = semitoneToNaturalNote[semitone];

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

    // Get responsive config
    const config = getStaffConfig(width);

    // Background - cream
    ctx.fillStyle = '#fff1dc';
    ctx.fillRect(0, 0, width, height);

    // Staff dimensions
    const staffHeight = config.lineSpacing * 4;
    const staffTop = (height - staffHeight) / 2;  // Center vertically
    const staffCenter = staffTop + staffHeight / 2;
    const nowLineX = width * config.nowLinePercent;
    const pixelsPerBeat = (width * 0.9) / config.beatsVisible;

    // Draw staff lines - brand color
    ctx.strokeStyle = '#1b354e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * config.lineSpacing;
      ctx.beginPath();
      ctx.moveTo(config.leftPadding, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Treble clef - responsive size
    ctx.fillStyle = '#1b354e';
    ctx.font = `${config.lineSpacing * config.clefSize}px serif`;
    ctx.fillText('𝄞', config.leftPadding + 10, staffTop + staffHeight + config.lineSpacing * 0.5);

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
    const getY = (midi: number) => staffCenter + getMidiStaffPosition(midi, config.lineSpacing);

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
      if (y < staffTop - config.lineSpacing / 2) {
        for (let ly = staffTop - config.lineSpacing; ly > y - config.lineSpacing / 2; ly -= config.lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(x - config.noteWidth - 8, ly);
          ctx.lineTo(x + config.noteWidth + 8, ly);
          ctx.stroke();
        }
      }

      // Below staff
      if (y > staffTop + staffHeight + config.lineSpacing / 2) {
        for (let ly = staffTop + staffHeight + config.lineSpacing; ly < y + config.lineSpacing / 2; ly += config.lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(x - config.noteWidth - 8, ly);
          ctx.lineTo(x + config.noteWidth + 8, ly);
          ctx.stroke();
        }
      }

      // Note head
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, config.noteWidth, config.noteWidth * 0.75, -0.2, 0, Math.PI * 2);

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

    // Debug: show userPitch on canvas
    ctx.fillStyle = '#1b354e';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`pitch: ${userPitch?.toFixed(1) ?? 'null'}`, nowLineX - 50, 30);

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

      // Draw pitch marker (no shadow for Safari compatibility)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nowLineX, clampedY, config.noteWidth + 4, 0, Math.PI * 2);
      ctx.fill();

      // Arrow if out of range
      if (isOutOfRange) {
        ctx.fillStyle = '#1b354e';
        ctx.font = `bold ${width < 640 ? 16 : 20}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(y < clampedY ? '▲' : '▼', nowLineX, clampedY + 6);
      }

      // Note label
      ctx.fillStyle = '#1b354e';
      ctx.font = `bold ${width < 640 ? 12 : 16}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(midiToNoteName(Math.round(userPitch)), nowLineX + config.noteWidth + 12, clampedY + 6);
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
