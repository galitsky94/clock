'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ClockProps {
  time: string; // Format: HH:MM:SS (12-hour format)
  size?: 'small' | 'medium' | 'large';
  hourColor?: string; // Optional color for the hour hand
}

export default function Clock({ time, size = 'medium', hourColor = '#333' }: ClockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine the clock size based on the size prop
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return 80;
      case 'large':
        return 200;
      default:
        return 120;
    }
  };

  const clockSize = getDimensions();

  // Parse the time string into hours, minutes, seconds
  const parseTime = useCallback((timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return { hours, minutes, seconds };
  }, []);

  // Helper function to draw clock hands
  const drawHand = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      length: number,
      angle: number,
      width: number,
      color: string
    ) => {
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;

      // Calculate hand coordinates
      const endX = centerX + length * Math.cos(angle);
      const endY = centerY + length * Math.sin(angle);

      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    },
    []
  );

  // Draw the clock face
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.9;

    // Parse the time
    const { hours, minutes, seconds } = parseTime(time);

    // Draw clock face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = radius * 0.02;
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Draw clock numbers
    ctx.font = `${radius * 0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    for (let i = 1; i <= 12; i++) {
      const angle = (i - 3) * (Math.PI / 6); // Start at 3 o'clock (0 radians)
      const x = centerX + radius * 0.8 * Math.cos(angle);
      const y = centerY + radius * 0.8 * Math.sin(angle);
      ctx.fillText(i.toString(), x, y);
    }

    // Draw hour marks
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const innerRadius = radius * 0.9;
      const outerRadius = radius;

      ctx.beginPath();
      ctx.moveTo(centerX + innerRadius * Math.cos(angle), centerY + innerRadius * Math.sin(angle));
      ctx.lineTo(centerX + outerRadius * Math.cos(angle), centerY + outerRadius * Math.sin(angle));
      ctx.lineWidth = radius * 0.02;
      ctx.strokeStyle = '#333';
      ctx.stroke();
    }

    // Draw hour hand
    const hourAngle = ((hours % 12) + minutes / 60) * (Math.PI / 6) - Math.PI / 2;
    drawHand(ctx, centerX, centerY, radius * 0.5, hourAngle, radius * 0.04, hourColor);

    // Draw minute hand
    const minuteAngle = (minutes + seconds / 60) * (Math.PI / 30) - Math.PI / 2;
    drawHand(ctx, centerX, centerY, radius * 0.75, minuteAngle, radius * 0.03, '#555');

    // Draw second hand
    const secondAngle = seconds * (Math.PI / 30) - Math.PI / 2;
    drawHand(ctx, centerX, centerY, radius * 0.85, secondAngle, radius * 0.01, '#D40000');

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#D40000';
    ctx.fill();
  }, [time, parseTime, drawHand, hourColor]);

  return (
    <canvas
      ref={canvasRef}
      width={clockSize}
      height={clockSize}
      className="shadow-sm rounded-full"
    />
  );
}
