import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, forwardRef, HTMLAttributes, MouseEventHandler, useCallback, useEffect, useRef } from 'react';
import { Corner } from '../assets/icons/Corner';
import { Trash } from '../assets/icons/Trash';

export interface InputProps<T> {
  onChange: (value: T | ((value: T) => T)) => void;
  value: T;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundingBoxWorkingCopy extends BoundingBox {
  origin: {
    canvas: {
      x: number;
      y: number;
    };
    inner?: {
      x: number;
      y: number;
    };
  };
  state: 'drawing' | 'editing';
}

const getStyleForBox = (box: BoundingBox) => {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`
  };
};

const applyBoundingBoxToElement = (element: HTMLDivElement, box: BoundingBox) => {
  if (!box) {
    const reset = getStyleForBox({ id: 'empty', x: 0, y: 0, width: 0, height: 0 });
    Object.assign(element.style, reset);
    return;
  }
  const style = getStyleForBox(box);
  Object.assign(element.style, style);
};

const updateBoxPositionFromMousePosition = (box: BoundingBoxWorkingCopy, x: number, y: number) => {
  if (!box.origin.inner) {
    throw new Error('Box origin inner is undefined');
  }
  return {
    ...box,
    x: Math.min(1 - box.width, Math.max(0, x - box.origin.inner.x)),
    y: Math.min(1 - box.height, Math.max(0, y - box.origin.inner.y))
  };
};

const updateBoxSizeFromMousePosition = (box: BoundingBoxWorkingCopy, x: number, y: number) => {
  const newX = Math.min(box.origin.canvas.x, x);
  const newY = Math.min(box.origin.canvas.y, y);

  const newWidth = Math.min(1, Math.max(0, Math.abs(x - box.origin.canvas.x)));
  const newHeight = Math.min(1, Math.max(0, Math.abs(y - box.origin.canvas.y)));

  return {
    ...box,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight
  };
};

export const BoundingBoxInput: FC<InputProps<BoundingBox[]>> = ({ onChange, value }) => {
  const pending = useRef<BoundingBoxWorkingCopy | null>(null);
  const pendingBoxRef = useRef<HTMLDivElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const boundingBoxOnMouseMove: MouseEventHandler<HTMLDivElement> = useCallback(event => {
    if (!pending.current) {
      return;
    }
    if (!containerRef.current) {
      return;
    }
    const node = containerRef.current;
    const rect = node.getBoundingClientRect();
    const box = pending.current;
    if (!box) return;

    try {
      const point = {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      };

      if (box.origin.inner && box.state === 'editing') {
        // If it was grabbed from the inside, then we want to update the position.
        pending.current = updateBoxPositionFromMousePosition(box, point.x, point.y);
        return;
      }

      // Otherwise, we are in resize mode.
      pending.current = updateBoxSizeFromMousePosition(box, point.x, point.y);
    } finally {
      applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
      event.stopPropagation();
      event.preventDefault();
    }
  }, []);

  const boundingBoxOnMouseDown: MouseEventHandler<HTMLDivElement> = useCallback(
    event => {
      if (pending.current) {
        return;
      }
      if (!containerRef.current) {
        return;
      }
      const node = containerRef.current;
      const box = event.target as HTMLDivElement;
      if (!box) {
        console.log('No box');
        return;
      }
      const id = box.getAttribute('data-id');
      if (!id) {
        console.log('No id');
        return;
      }
      const rect = node.getBoundingClientRect();
      // Boxes are normalised to be 0-1 for all dimensions
      const origin = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      };

      try {
        const box = value.find(b => b.id === id);
        if (!box) throw new Error('Box not found');
        // Where the click is in relation to the box
        const inner = {
          x: origin.x - box.x,
          y: origin.y - box.y
        };

        pending.current = {
          ...box,
          origin: { canvas: origin, inner },
          state: 'editing'
        };

        return;
      } finally {
        box.style.opacity = '0';

        if (!pendingBoxRef.current || !pending.current) {
          console.warn('No pending box or pending');
        }

        pendingBoxRef.current!.style.opacity = '1';
        applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
        event.stopPropagation();
        event.preventDefault();
      }
    },
    [value]
  );

  const boundingBoxOnMouseUp: MouseEventHandler<HTMLDivElement> = useCallback(
    event => {
      if (!pending.current) {
        return;
      }
      if (!containerRef.current) {
        return;
      }
      const box = event.target as HTMLDivElement;
      if (!box) {
        console.log('No box');
        return;
      }

      try {
        if (!pending.current) return;
        if (pending.current.width < 0.05 || pending.current.height < 0.05) {
          // If the box is too small, we should remove it.
          return;
        }

        onChange(value => {
          if (!value) return [pending.current!];
          return [...value.filter(box => box.id !== pending.current!.id), pending.current!];
        });
      } finally {
        box.style.opacity = '1';
        pendingBoxRef.current!.style.opacity = '0';

        pending.current = null;
        applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
        event.stopPropagation();
        event.preventDefault();
      }
    },
    [onChange]
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      console.log('No ref!');
      return;
    }
    const abortController = new AbortController();

    node.addEventListener(
      'mousedown',
      e => {
        if (pending.current) {
          return;
        }
        const rect = node.getBoundingClientRect();
        // Boxes are normalised to be 0-1 for all dimensions
        const origin = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        };

        try {
          pending.current = {
            id: crypto.randomUUID(),
            x: origin.x,
            y: origin.y,
            width: 0,
            height: 0,
            origin: {
              canvas: origin
            },
            state: 'drawing'
          };
        } finally {
          pendingBoxRef.current!.style.opacity = '1';
          applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
          e.stopPropagation();
          e.preventDefault();
        }
      },
      { signal: abortController.signal }
    );

    node.addEventListener(
      'mousemove',
      e => {
        const box = pending.current;
        if (!box) return;

        const rect = node.getBoundingClientRect();
        try {
          const point = {
            x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
          };

          if (box.origin.inner && box.state === 'editing') {
            // If it was grabbed from the inside, then we want to update the position.
            pending.current = updateBoxPositionFromMousePosition(box, point.x, point.y);
            return;
          }

          // Otherwise, we are in resize mode.
          pending.current = updateBoxSizeFromMousePosition(box, point.x, point.y);
        } finally {
          applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
        }
      },
      { signal: abortController.signal }
    );

    node.addEventListener(
      'mouseup',
      () => {
        try {
          if (!pending.current) return;
          if (pending.current.width < 0.05 || pending.current.height < 0.05) {
            // If the box is too small, we should remove it.
            return;
          }

          onChange(value => {
            if (!value) return [pending.current!];
            return [...value.filter(box => box.id !== pending.current!.id), pending.current!];
          });
        } finally {
          const clickedBoxElement = node.querySelector<HTMLDivElement>(`[data-id="${pending.current!.id}"]`);
          if (clickedBoxElement) {
            clickedBoxElement.style.opacity = '1';
          }
          pendingBoxRef.current!.style.opacity = '0';
          pending.current = null;
          applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
        }
      },
      { signal: abortController.signal }
    );

    return () => abortController.abort();
  }, [onChange, value]);

  return (
    <>
      <div className="absolute inset-0 z-40 pointer-events-none">
        {value.map(box => (
          <BoundingBox
            key={`${box.id}-${box.x}-${box.y}`}
            data-id={box.id}
            style={getStyleForBox(box)}
            onMouseDown={boundingBoxOnMouseDown}
            onMouseMove={boundingBoxOnMouseMove}
            onMouseUp={boundingBoxOnMouseUp}
          >
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              className="bg-black bg-opacity-40 text-white flex justify-center items-center p-2 rounded-lg absolute top-3 right-3"
              onClick={e => {
                onChange(value => value.filter(b => b.id !== box.id));
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Trash />
            </motion.button>
          </BoundingBox>
        ))}
      </div>
      <div ref={containerRef} className="absolute inset-0 z-30 cursor-crosshair">
        <BoundingBox offset={0} style={{ opacity: 0 }} className="overflow-clip" ref={pendingBoxRef}></BoundingBox>
      </div>
    </>
  );
};

interface BoundingBoxProps extends HTMLAttributes<HTMLDivElement> {
  offset?: number;
}
const BoundingBox = forwardRef<HTMLDivElement, BoundingBoxProps>(
  ({ children, className, offset = 4, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('absolute bg-white bg-opacity-25 shadow-md pointer-events-auto', className)}
        {...props}
      >
        {children}
        <motion.span initial={{ left: 0, top: 0 }} animate={{ left: -offset, top: -offset }} className="absolute">
          <Corner />
        </motion.span>
        <motion.span initial={{ right: 0, top: 0 }} animate={{ right: -offset, top: -offset }} className="absolute">
          <Corner className="rotate-90" />
        </motion.span>
        <motion.span initial={{ left: 0, bottom: 0 }} animate={{ left: -offset, bottom: -offset }} className="absolute">
          <Corner className="-rotate-90" />
        </motion.span>
        <motion.span
          initial={{ right: 0, bottom: 0 }}
          animate={{ right: -offset, bottom: -offset }}
          className="absolute"
        >
          <Corner className="rotate-180" />
        </motion.span>
      </div>
    );
  }
);

interface BoundingBoxViewProps extends HTMLAttributes<HTMLDivElement> {
  boxes: BoundingBox[];
}

export const BoundingBoxView: FC<BoundingBoxViewProps> = ({ boxes, className, ...props }) => {
  return (
    <div className={cn('absolute inset-0 z-10 pointer-events-none', className)} {...props}>
      <AnimatePresence initial={false}>
        {boxes.map(box => (
          <BoundingBox
            offset={6}
            key={box.id}
            style={getStyleForBox(box)}
            className="bg-opacity-0 border-2 border-dashed border-white"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
