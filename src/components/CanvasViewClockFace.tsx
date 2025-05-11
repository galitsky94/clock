'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Clock from '@/components/Clock';

interface CanvasViewProps {
  totalClocks: number;
}

interface ClockPosition {
  id: number;
  x: number;
  y: number;
  visible: boolean;
  detailLevel: 'high' | 'medium' | 'low' | 'dot';
  hour: number; // The hour shown on this clock (0-11)
}

export default function CanvasViewClockFace({ totalClocks }: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1); // Initial zoom level
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Pan position
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clockPositions, setClockPositions] = useState<ClockPosition[]>([]);
  const [selectedClock, setSelectedClock] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate clock positions in a clock face formation - This is now done with useMemo to improve performance
  const generateClockPositions = useMemo(() => {
    // Don't calculate positions if total clocks is not yet defined
    if (!totalClocks) return [];

    const positions: ClockPosition[] = [];

    // Canvas size parameters - these define the giant clock
    const centerX = 0;
    const centerY = 0;
    const overallRadius = 2000; // Radius of the giant clock

    // Hour marker parameters
    const hourMarkerRadius = overallRadius * 0.85; // Radius for hour markers

    // Calculate clocks per hour (distribute evenly)
    const clocksPerHour = Math.floor(totalClocks / 12);
    const remainder = totalClocks % 12;

    // We'll limit the initial render to just the hour markers and a subset of clocks
    // This dramatically improves initial load time
    const initialClockLimit = 500; // Only generate a subset of clocks initially
    let currentClockCount = 0;

    // Loop through each hour position (0-11)
    for (let hour = 0; hour < 12; hour++) {
      // Calculate how many clocks to place at this hour
      const clocksAtThisHour = clocksPerHour + (hour < remainder ? 1 : 0);

      // Calculate hour marker position
      const hourAngle = (hour * Math.PI / 6) - Math.PI / 2; // Start at 12 o'clock
      const hourX = centerX + hourMarkerRadius * Math.cos(hourAngle);
      const hourY = centerY + hourMarkerRadius * Math.sin(hourAngle);

      // Determine optimal grid layout for the hour marker cluster
      const gridSize = Math.ceil(Math.sqrt(clocksAtThisHour));

      // Place clocks in a grid around each hour marker, but limit initial count
      const initialClocksThisHour = Math.min(Math.ceil(initialClockLimit / 12), clocksAtThisHour);

      for (let i = 0; i < initialClocksThisHour; i++) {
        if (currentClockCount >= initialClockLimit) break;

        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        // Calculate the starting ID for this hour
        const baseId = hour * clocksPerHour + (hour < remainder ? hour : remainder);
        const clockId = baseId + i;

        // Calculate the offset from the hour marker center
        const clockSize = 40; // Base size of each individual clock
        const hourClusterPadding = 5; // Spacing between clocks in each hour cluster
        const offsetX = (col - gridSize / 2) * (clockSize + hourClusterPadding);
        const offsetY = (row - gridSize / 2) * (clockSize + hourClusterPadding);

        // Final position for this clock
        positions.push({
          id: clockId,
          x: hourX + offsetX,
          y: hourY + offsetY,
          visible: false, // Will be determined by updateVisibleClocks
          detailLevel: 'dot', // Initial detail level
          hour: hour
        });

        currentClockCount++;
      }
    }

    // Also place minute markers around the clock face
    const minuteMarkerRadius = overallRadius * 0.97;

    for (let minute = 0; minute < 60; minute++) {
      // Only place markers at 5-minute intervals
      if (minute % 5 !== 0) continue;

      const minuteAngle = (minute * Math.PI / 30) - Math.PI / 2;
      const minuteX = centerX + minuteMarkerRadius * Math.cos(minuteAngle);
      const minuteY = centerY + minuteMarkerRadius * Math.sin(minuteAngle);

      // Add a fixed marker (not an actual clock)
      positions.push({
        id: totalClocks + minute, // Use an ID outside the normal range
        x: minuteX,
        y: minuteY,
        visible: false,
        detailLevel: 'dot',
        hour: -1 // Special value to indicate this is a minute marker
      });
    }

    // Add hour & minute hands to the giant clock
    // Calculate current time
    const now = new Date();
    const currentHour = now.getHours() % 12;
    const currentMinute = now.getMinutes();

    // Add center point
    positions.push({
      id: totalClocks + 100,
      x: centerX,
      y: centerY,
      visible: false,
      detailLevel: 'dot',
      hour: -2 // Special value for the center point
    });

    // Add hour hand points
    const hourHandLength = overallRadius * 0.6;
    const hourAngle = ((currentHour + currentMinute / 60) * Math.PI / 6) - Math.PI / 2;

    for (let i = 0; i < 10; i++) {
      const ratio = i / 9; // 0 to 1
      const handX = centerX + hourHandLength * ratio * Math.cos(hourAngle);
      const handY = centerY + hourHandLength * ratio * Math.sin(hourAngle);

      // Add points for the hour hand
      positions.push({
        id: totalClocks + 101 + i,
        x: handX,
        y: handY,
        visible: false,
        detailLevel: 'dot',
        hour: -3 // Special value for hour hand
      });
    }

    // Add minute hand points
    const minuteHandLength = overallRadius * 0.8;
    const minuteAngle = (currentMinute * Math.PI / 30) - Math.PI / 2;

    for (let i = 0; i < 10; i++) {
      const ratio = i / 9; // 0 to 1
      const handX = centerX + minuteHandLength * ratio * Math.cos(minuteAngle);
      const handY = centerY + minuteHandLength * ratio * Math.sin(minuteAngle);

      // Add points for the minute hand
      positions.push({
        id: totalClocks + 111 + i,
        x: handX,
        y: handY,
        visible: false,
        detailLevel: 'dot',
        hour: -4 // Special value for minute hand
      });
    }

    return positions;
  }, [totalClocks]);

  // Set initial positions only once with useEffect
  useEffect(() => {
    setClockPositions(generateClockPositions);

    // Set initial position to center the clock face
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setPosition({
        x: width / 2,
        y: height / 2
      });
    }

    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Small delay to ensure UI is responsive

    return () => clearTimeout(timer);
  }, [generateClockPositions]);

  // Convert second index to time format (HH:MM:SS)
  const getTimeFromSeconds = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format with leading zeros and handle 12-hour format
    const formattedHours = hours === 0 ? 12 : hours;
    return `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Update which clocks are visible and at what detail level based on current view
  const updateVisibleClocks = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const visibleMinX = -position.x / scale - 100; // Buffer for smoother rendering
    const visibleMaxX = visibleMinX + (containerRect.width / scale) + 200;
    const visibleMinY = -position.y / scale - 100;
    const visibleMaxY = visibleMinY + (containerRect.height / scale) + 200;

    // Different detail levels based on zoom
    const detailThreshold = {
      high: 0.8,    // Detailed clocks
      medium: 0.4,  // Simplified clocks
      low: 0.15     // Very simple clocks
    };

    // Limit the number of high detail clocks for performance
    const maxHighDetailClocks = 200;
    const maxMediumDetailClocks = 500;

    // Count how many clocks would be high/medium detail
    let highDetailCount = 0;
    let mediumDetailCount = 0;

    setClockPositions(prev => {
      // First pass: mark all as visible/not visible and count potential high/medium detail clocks
      const updatedClocks = prev.map(clock => {
        const isVisible = clock.x >= visibleMinX &&
                          clock.x <= visibleMaxX &&
                          clock.y >= visibleMinY &&
                          clock.y <= visibleMaxY;

        let potentialDetailLevel: 'high' | 'medium' | 'low' | 'dot';
        if (scale >= detailThreshold.high) {
          potentialDetailLevel = 'high';
          if (isVisible) highDetailCount++;
        } else if (scale >= detailThreshold.medium) {
          potentialDetailLevel = 'medium';
          if (isVisible) mediumDetailCount++;
        } else if (scale >= detailThreshold.low) {
          potentialDetailLevel = 'low';
        } else {
          potentialDetailLevel = 'dot';
        }

        return { ...clock, visible: isVisible, potentialDetailLevel };
      });

      // Second pass: adjust detail levels if there are too many high/medium detail clocks
      return updatedClocks.map(clock => {
        if (!clock.visible) return { ...clock, detailLevel: 'dot' };

        let detailLevel: 'high' | 'medium' | 'low' | 'dot';

        // For special elements like center point and hands, always use their potential detail level
        if (clock.hour < 0) {
          detailLevel = clock.potentialDetailLevel || 'dot';
        } else if (clock.potentialDetailLevel === 'high' && highDetailCount > maxHighDetailClocks) {
          // Downgrade some high detail clocks if there are too many
          const distanceFromCenter = Math.sqrt(clock.x * clock.x + clock.y * clock.y);
          detailLevel = distanceFromCenter < 1000 ? 'high' : 'medium';
        } else if (clock.potentialDetailLevel === 'medium' && mediumDetailCount > maxMediumDetailClocks) {
          // Downgrade some medium detail clocks if there are too many
          const distanceFromCenter = Math.sqrt(clock.x * clock.x + clock.y * clock.y);
          detailLevel = distanceFromCenter < 1500 ? 'medium' : 'low';
        } else {
          detailLevel = clock.potentialDetailLevel || 'dot';
        }

        return { ...clock, detailLevel };
      });
    });
  }, [position, scale]);

  // Update visible clocks when the view changes
  useEffect(() => {
    updateVisibleClocks();
  }, [updateVisibleClocks]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.0005;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.max(0.05, Math.min(3, scale + delta * scale));

    // Calculate the mouse position within the container
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Calculate new position to zoom centered on mouse position
    const newPosition = {
      x: mouseX - (mouseX - position.x) * (newScale / scale),
      y: mouseY - (mouseY - position.y) * (newScale / scale)
    };

    setScale(newScale);
    setPosition(newPosition);
  }, [scale, position]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  // Handle mouse up to end panning
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom control buttons
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.05, prev / 1.2));
  }, []);

  const resetView = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setScale(0.1);
      setPosition({
        x: width / 2,
        y: height / 2
      });
    }
  }, []);

  // Handle clicking on a clock
  const handleClockClick = useCallback((clockId: number) => {
    if (clockId < totalClocks) {
      setSelectedClock(clockId);
    }
  }, [totalClocks]);

  // Get color for a clock based on its hour
  const getClockColor = useCallback((hour: number): string => {
    const specialColors = {
      '-1': '#333', // Minute markers
      '-2': '#D40000', // Center point
      '-3': '#333', // Hour hand
      '-4': '#555' // Minute hand
    };

    if (hour < 0) {
      return specialColors[hour as keyof typeof specialColors] || '#666';
    }

    // Colors for each hour position
    const hourColors = [
      '#3B82F6', // 12 o'clock - blue
      '#8B5CF6', // 1 o'clock - purple
      '#EC4899', // 2 o'clock - pink
      '#EF4444', // 3 o'clock - red
      '#F97316', // 4 o'clock - orange
      '#F59E0B', // 5 o'clock - amber
      '#10B981', // 6 o'clock - green
      '#14B8A6', // 7 o'clock - teal
      '#06B6D4', // 8 o'clock - cyan
      '#0EA5E9', // 9 o'clock - sky
      '#6366F1', // 10 o'clock - indigo
      '#A855F7', // 11 o'clock - purple
    ];

    return hourColors[hour];
  }, []);

  // Render details for a clock based on detail level - this is memoized for performance
  const visibleClocks = useMemo(() => {
    return clockPositions
      .filter(clock => clock.visible)
      .map(clock => {
        // Calculate the transformation for the clock
        const transformValue = `translate(${clock.x}px, ${clock.y}px)`;
        const timeString = getTimeFromSeconds(clock.id);

        // Skip rendering for special markers when zoomed in
        if (clock.hour < 0 && scale > 0.4) {
          return null;
        }

        // Different rendering for special elements
        if (clock.hour === -2) { // Center point
          return (
            <div
              key={clock.id}
              className="absolute"
              style={{
                width: scale > 0.4 ? '40px' : '20px',
                height: scale > 0.4 ? '40px' : '20px',
                backgroundColor: '#D40000',
                borderRadius: '50%',
                transform: `${transformValue} translate(-50%, -50%)`
              }}
            />
          );
        }

        if (clock.hour === -1) { // Minute markers
          return (
            <div
              key={clock.id}
              className="absolute"
              style={{
                width: scale > 0.2 ? '10px' : '5px',
                height: scale > 0.2 ? '20px' : '10px',
                backgroundColor: '#333',
                transform: `${transformValue} translate(-50%, -50%)`
              }}
            />
          );
        }

        if (clock.hour === -3 || clock.hour === -4) { // Clock hands
          return (
            <div
              key={clock.id}
              className="absolute"
              style={{
                width: clock.hour === -3 ? '40px' : '25px',
                height: clock.hour === -3 ? '40px' : '25px',
                backgroundColor: getClockColor(clock.hour),
                borderRadius: '50%',
                transform: `${transformValue} translate(-50%, -50%)`
              }}
            />
          );
        }

        // Regular clocks
        if (clock.id < totalClocks) {
          switch (clock.detailLevel) {
            case 'high':
              // Full detailed clock with time
              return (
                <div
                  key={clock.id}
                  className="absolute cursor-pointer flex flex-col items-center"
                  style={{
                    transform: `${transformValue} translate(-50%, -50%)`,
                    transition: 'transform 0.1s ease'
                  }}
                  onClick={() => handleClockClick(clock.id)}
                >
                  <Clock time={timeString} size="small" hourColor={getClockColor(clock.hour)} />
                  <p className="text-xs mt-1 bg-white px-2 rounded-full shadow-sm" style={{ color: getClockColor(clock.hour) }}>
                    {timeString}
                  </p>
                </div>
              );

            case 'medium':
              // Simplified clock without text
              return (
                <div
                  key={clock.id}
                  className="absolute cursor-pointer"
                  style={{
                    transform: `${transformValue} translate(-50%, -50%)`,
                    transition: 'transform 0.1s ease'
                  }}
                  onClick={() => handleClockClick(clock.id)}
                >
                  <Clock time={timeString} size="small" hourColor={getClockColor(clock.hour)} />
                </div>
              );

            case 'low':
              // Very simplified representation
              return (
                <div
                  key={clock.id}
                  className="absolute cursor-pointer flex items-center justify-center"
                  style={{
                    transform: `${transformValue} translate(-50%, -50%)`,
                    width: '30px',
                    height: '30px',
                    backgroundColor: 'white',
                    border: `2px solid ${getClockColor(clock.hour)}`,
                    borderRadius: '50%',
                    transition: 'transform 0.1s ease'
                  }}
                  onClick={() => handleClockClick(clock.id)}
                />
              );

            case 'dot': {
              // Just a dot representation
              return (
                <div
                  key={clock.id}
                  className="absolute cursor-pointer"
                  style={{
                    transform: `${transformValue} translate(-50%, -50%)`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: getClockColor(clock.hour),
                    borderRadius: '50%',
                    transition: 'transform 0.1s ease'
                  }}
                  onClick={() => handleClockClick(clock.id)}
                />
              );
            }
          }
        }

        return null;
      });
  }, [clockPositions, scale, getTimeFromSeconds, getClockColor, handleClockClick, totalClocks]);

  return (
    <div className="w-full flex flex-col">
      {/* Canvas controls */}
      <div className="flex justify-between items-center mb-4 bg-gray-100 p-3 rounded-lg">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={zoomIn}>Zoom In</Button>
          <Button variant="outline" size="sm" onClick={zoomOut}>Zoom Out</Button>
          <Button variant="outline" size="sm" onClick={resetView}>Reset View</Button>
        </div>
        <div className="text-sm text-gray-600">
          Zoom: {Math.round(scale * 100)}% • Visible clocks: {clockPositions.filter(c => c.visible && c.id < totalClocks).length}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Tip:</span> Use mouse wheel to zoom, drag to pan
        </div>
      </div>

      {/* The canvas area */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] overflow-hidden border rounded-lg bg-gray-50 cursor-grab"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading clocks...</p>
            </div>
          </div>
        ) : (
          <div
            className="absolute"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: '1px', // Just a reference point
              height: '1px'
            }}
          >
            {/* Draw the clock face circle */}
            <div
              className="absolute"
              style={{
                width: '4000px',
                height: '4000px',
                border: '2px solid #ddd',
                borderRadius: '50%',
                transform: 'translate(-2000px, -2000px)'
              }}
            />

            {/* Render the visible clocks - now rendering from a memoized collection */}
            {visibleClocks}
          </div>
        )}

        {/* Mini-map in the corner */}
        <div className="absolute bottom-4 right-4 w-40 h-40 bg-white border border-gray-300 rounded shadow-md overflow-hidden">
          <div className="w-full h-full bg-gray-100 relative">
            {/* Clock face circle in the minimap */}
            <div
              className="absolute"
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #aaa',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />

            {/* Visible area indicator */}
            <div
              className="absolute border-2 border-blue-500"
              style={{
                width: `${Math.min(100, (containerRef.current?.clientWidth || 0) / (4000 * scale) * 100)}%`,
                height: `${Math.min(100, (containerRef.current?.clientHeight || 0) / (4000 * scale) * 100)}%`,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translate(${-position.x / (4000 * scale) * 100}%, ${-position.y / (4000 * scale) * 100}%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Selected clock details */}
      {selectedClock !== null && (
        <div className="mt-4 p-4 border rounded-lg bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">Clock #{selectedClock + 1}</h3>
          <div className="flex items-center space-x-4">
            <Clock time={getTimeFromSeconds(selectedClock)} size="medium" />
            <div>
              <p className="text-lg font-medium">{getTimeFromSeconds(selectedClock)}</p>
              <p className="text-sm text-gray-500">Forever frozen at this time</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
