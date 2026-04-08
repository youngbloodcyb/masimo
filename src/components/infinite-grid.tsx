"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type RefObject,
} from "react";

// Grid physics constants
const MIN_VELOCITY = 0.2;
const UPDATE_INTERVAL = 16;
const VELOCITY_HISTORY_SIZE = 5;
const FRICTION = 0.9;
const VELOCITY_THRESHOLD = 0.3;

type Position = {
  x: number;
  y: number;
};

type GridItem = {
  position: Position;
  gridIndex: number;
};

export type ItemConfig = {
  isMoving: boolean;
  position: Position;
  gridIndex: number;
};

export type InfiniteGridProps = {
  gridSize: number;
  renderItem: (itemConfig: ItemConfig) => React.ReactNode;
  className?: string;
  initialPosition?: Position;
};

function getDistance(p1: Position, p2: Position) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getItemIndexForPosition(x: number, y: number): number {
  if (x === 0 && y === 0) return 0;

  const layer = Math.max(Math.abs(x), Math.abs(y));
  const innerLayersSize = (2 * layer - 1) ** 2;

  let positionInLayer = 0;

  if (y === 0 && x === layer) {
    positionInLayer = 0;
  } else if (y < 0 && x === layer) {
    positionInLayer = -y;
  } else if (y === -layer && x > -layer) {
    positionInLayer = layer + (layer - x);
  } else if (x === -layer && y < layer) {
    positionInLayer = 3 * layer + (layer + y);
  } else if (y === layer && x < layer) {
    positionInLayer = 5 * layer + (layer + x);
  } else {
    positionInLayer = 7 * layer + (layer - y);
  }

  return innerLayersSize + positionInLayer;
}

export default function InfiniteGrid({
  gridSize,
  renderItem,
  className,
  initialPosition,
}: InfiniteGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<Position>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const lastUpdateTime = useRef(0);
  const stopMovingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [offset, setOffset] = useState<Position>(
    () => initialPosition ?? { x: 0, y: 0 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [isMoving, setIsMoving] = useState(false);

  // Use refs for values needed in animation loop to avoid stale closures
  const offsetRef = useRef(offset);
  const velocityRef = useRef<Position>({ x: 0, y: 0 });
  const startPosRef = useRef<Position>(initialPosition ?? { x: 0, y: 0 });
  const restPosRef = useRef<Position>(initialPosition ?? { x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const velocityHistoryRef = useRef<Position[]>([]);
  const lastMoveTimeRef = useRef(0);

  // Keep offset ref in sync
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const calculateVisiblePositions = useCallback((): Position[] => {
    const container = containerRef.current;
    if (!container) return [];

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const cellsX = Math.ceil(width / gridSize);
    const cellsY = Math.ceil(height / gridSize);

    const centerX = -Math.round(offsetRef.current.x / gridSize);
    const centerY = -Math.round(offsetRef.current.y / gridSize);

    const positions: Position[] = [];
    const halfCellsX = Math.ceil(cellsX / 2);
    const halfCellsY = Math.ceil(cellsY / 2);

    for (let y = centerY - halfCellsY; y <= centerY + halfCellsY; y++) {
      for (let x = centerX - halfCellsX; x <= centerX + halfCellsX; x++) {
        positions.push({ x, y });
      }
    }

    return positions;
  }, [gridSize]);

  const updateGridItems = useCallback(() => {
    const positions = calculateVisiblePositions();
    const newItems = positions.map((position) => ({
      position,
      gridIndex: getItemIndexForPosition(position.x, position.y),
    }));

    const distanceFromRest = getDistance(offsetRef.current, restPosRef.current);
    setGridItems(newItems);
    setIsMoving(distanceFromRest > 5);

    if (stopMovingTimer.current) clearTimeout(stopMovingTimer.current);
    stopMovingTimer.current = setTimeout(() => {
      setIsMoving(false);
      restPosRef.current = { ...offsetRef.current };
    }, 200);
  }, [calculateVisiblePositions]);

  const animate = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastUpdateTime.current;

    if (deltaTime >= UPDATE_INTERVAL) {
      const velocity = velocityRef.current;
      const speed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y
      );

      if (speed < MIN_VELOCITY) {
        velocityRef.current = { x: 0, y: 0 };
        return;
      }

      let deceleration = FRICTION;
      if (speed < VELOCITY_THRESHOLD) {
        deceleration = FRICTION * (speed / VELOCITY_THRESHOLD);
      }

      const newOffset = {
        x: offsetRef.current.x + velocity.x,
        y: offsetRef.current.y + velocity.y,
      };
      const newVelocity = {
        x: velocity.x * deceleration,
        y: velocity.y * deceleration,
      };

      offsetRef.current = newOffset;
      velocityRef.current = newVelocity;
      setOffset(newOffset);
      updateGridItems();

      lastUpdateTime.current = currentTime;
    }

    animationFrame.current = requestAnimationFrame(animate);
  }, [updateGridItems]);

  const handleDown = useCallback(
    (p: Position) => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      startPosRef.current = {
        x: p.x - offsetRef.current.x,
        y: p.y - offsetRef.current.y,
      };
      velocityRef.current = { x: 0, y: 0 };
      velocityHistoryRef.current = [];
      isDraggingRef.current = true;
      setIsDragging(true);

      lastPos.current = { x: p.x, y: p.y };
    },
    []
  );

  const handleMove = useCallback(
    (p: Position) => {
      if (!isDraggingRef.current) return;

      const currentTime = performance.now();
      const timeDelta = currentTime - lastMoveTimeRef.current;

      const rawVelocity = {
        x: (p.x - lastPos.current.x) / (timeDelta || 1),
        y: (p.y - lastPos.current.y) / (timeDelta || 1),
      };

      const history = [...velocityHistoryRef.current, rawVelocity];
      if (history.length > VELOCITY_HISTORY_SIZE) {
        history.shift();
      }
      velocityHistoryRef.current = history;

      const smoothedVelocity = history.reduce(
        (acc, vel) => ({
          x: acc.x + vel.x / history.length,
          y: acc.y + vel.y / history.length,
        }),
        { x: 0, y: 0 }
      );

      velocityRef.current = smoothedVelocity;
      lastMoveTimeRef.current = currentTime;

      const newOffset = {
        x: p.x - startPosRef.current.x,
        y: p.y - startPosRef.current.y,
      };
      offsetRef.current = newOffset;
      setOffset(newOffset);
      updateGridItems();

      lastPos.current = { x: p.x, y: p.y };
    },
    [updateGridItems]
  );

  const handleUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    animationFrame.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDown({ x: e.clientX, y: e.clientY });
    },
    [handleDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleMove({ x: e.clientX, y: e.clientY });
    },
    [handleMove]
  );

  // Mount: add non-passive listeners and compute initial grid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newOffset = {
        x: offsetRef.current.x - e.deltaX,
        y: offsetRef.current.y - e.deltaY,
      };
      offsetRef.current = newOffset;
      velocityRef.current = { x: 0, y: 0 };
      setOffset(newOffset);
      updateGridItems();
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      handleMove({ x: touch.clientX, y: touch.clientY });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });

    updateGridItems();

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchmove", onTouchMove);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (stopMovingTimer.current) clearTimeout(stopMovingTimer.current);
    };
  }, [updateGridItems, handleMove]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleDown({ x: touch.clientX, y: touch.clientY });
    },
    [handleDown]
  );

  const handleTouchEnd = useCallback(() => {
    handleUp();
  }, [handleUp]);

  const containerRect = containerRef.current?.getBoundingClientRect();
  const containerWidth = containerRect?.width ?? 0;
  const containerHeight = containerRect?.height ?? 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        touchAction: "none",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          willChange: "transform",
        }}
      >
        {gridItems.map((item) => {
          const x = item.position.x * gridSize + containerWidth / 2;
          const y = item.position.y * gridSize + containerHeight / 2;

          return (
            <div
              key={`${item.position.x}-${item.position.y}`}
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                width: gridSize,
                height: gridSize,
                transform: `translate3d(${x}px, ${y}px, 0)`,
                marginLeft: `-${gridSize / 2}px`,
                marginTop: `-${gridSize / 2}px`,
                willChange: "transform",
              }}
            >
              {renderItem({
                gridIndex: item.gridIndex,
                position: item.position,
                isMoving,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
