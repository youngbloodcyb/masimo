"use client";

import InfiniteGrid from "@/components/infinite-grid";

export default function Home() {
  return (
    <div className="relative w-screen h-screen bg-zinc-950">
      <InfiniteGrid
        gridSize={120}
        renderItem={({ gridIndex, position }) => (
          <div className="flex flex-col items-center justify-center w-full h-full border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-400 text-sm select-none">
            <span className="text-lg font-mono font-semibold text-zinc-200">
              {gridIndex}
            </span>
            <span className="text-xs text-zinc-600">
              {position.x},{position.y}
            </span>
          </div>
        )}
      />
    </div>
  );
}
