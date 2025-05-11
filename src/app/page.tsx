import ClockGenerator from '@/components/ClockGenerator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="max-w-3xl text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">43,200 Broken Clocks</h1>
        <p className="text-gray-500 mb-8 text-lg">
          They say that even a broken clock is right twice a day. So I made 43,200 broken clocks that will always tell me the right time of the day.
        </p>
        <div className="flex flex-col gap-3 mb-8 items-center">
          <Link href="/clockface">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              View Meta Clock Formation ✨
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            View all 43,200 clocks arranged to form one giant meta-clock - a recursive design where the whole reflects the parts.
          </p>
        </div>
      </div>
      <div className="w-full">
        <ClockGenerator />
      </div>
    </main>
  );
}
