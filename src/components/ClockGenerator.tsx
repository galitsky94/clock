'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Clock from '@/components/Clock';

export default function ClockGenerator() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClock, setSelectedClock] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 24;
  const totalClocks = 43200; // 12 hours * 60 minutes * 60 seconds
  const totalPages = Math.ceil(totalClocks / itemsPerPage);

  // Calculate the range of clocks to display on current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalClocks);

  // Generate the clock seconds for the current page
  const currentClocks = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);

  // Handle page navigation with loading state
  const navigateToPage = useCallback((newPage: number) => {
    // Ensure page is within valid range
    if (newPage < 1 || newPage > totalPages) return;

    setIsLoading(true);
    // Simulate loading delay to prevent UI flickering for adjacent pages
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsLoading(false);
    }, 300);
  }, [totalPages]);

  // Allow navigation with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight') {
        navigateToPage(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, navigateToPage]);

  // Convert second index to time format (HH:MM:SS)
  const getTimeFromSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format with leading zeros and handle 12-hour format
    const formattedHours = hours === 0 ? 12 : hours;
    return `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Allow jumping to a specific page
  const handleJumpToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      const page = Number.parseInt(input.value);
      if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
        navigateToPage(page);
      }
      input.value = '';
    }
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Browse All 43,200 Broken Clocks</h2>
        <p className="text-sm text-gray-500 mb-4">
          Each clock shows a unique time, permanently fixed at that exact second
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button
            onClick={() => navigateToPage(1)}
            disabled={currentPage === 1 || isLoading}
            variant="outline"
            size="sm"
          >
            First
          </Button>
          <Button
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="flex items-center py-2 px-4 border rounded">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
          <Button
            onClick={() => navigateToPage(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            variant="outline"
            size="sm"
          >
            Last
          </Button>
          <div className="flex items-center ml-2">
            <input
              type="number"
              placeholder="Go to page"
              className="w-20 px-2 py-1 border rounded text-sm"
              min={1}
              max={totalPages}
              onKeyDown={handleJumpToPage}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Time range: {getTimeFromSeconds(startIndex)} - {getTimeFromSeconds(endIndex - 1)}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: itemsPerPage }, (_, i) => (
            <Card key={`loading-${i}`} className="animate-pulse">
              <CardContent className="p-4 h-32 flex flex-col items-center justify-center">
                <div className="rounded-full bg-gray-200 h-16 w-16 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-8" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {currentClocks.map(clockIndex => (
            <Card
              key={clockIndex}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedClock(clockIndex)}
            >
              <CardContent className="p-4 flex flex-col items-center">
                <Clock time={getTimeFromSeconds(clockIndex)} size="small" />
                <p className="text-sm mt-2">{getTimeFromSeconds(clockIndex)}</p>
                <p className="text-xs text-gray-500">#{clockIndex + 1}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clock detail dialog */}
      <Dialog open={selectedClock !== null} onOpenChange={() => setSelectedClock(null)}>
        <DialogContent className="max-w-md">
          {selectedClock !== null && (
            <>
              <DialogHeader>
                <DialogTitle>Broken Clock #{selectedClock + 1}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center py-4">
                <Clock time={getTimeFromSeconds(selectedClock)} size="large" />
                <p className="text-lg font-medium mt-4">{getTimeFromSeconds(selectedClock)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Forever stuck at this moment in time
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
