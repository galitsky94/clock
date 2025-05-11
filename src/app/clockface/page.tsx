import CanvasViewClockFace from '@/components/CanvasViewClockFace';

export default function ClockFacePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="max-w-5xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Meta Clock</h1>
          <p className="text-gray-500 text-lg mb-6">
            All 43,200 clocks arranged to form a giant clock face.
          </p>
          <p className="text-sm bg-yellow-50 p-3 rounded-md border border-yellow-200 inline-block">
            <span className="font-medium">Tip:</span> Use mouse wheel to zoom, drag to pan around the clock.
          </p>
        </div>

        <CanvasViewClockFace totalClocks={43200} />

        <div className="mt-4 flex gap-4 justify-center">
          <a href="/" className="text-blue-500 hover:underline">
            ← Back to Collection
          </a>
        </div>
      </div>
    </main>
  );
}
