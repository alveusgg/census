import SiTrash from '@/components/icons/SiTrash';
import type { BoundingBox, Selection } from '@/services/video/CaptureEditorProvider';
import { getColorForId } from '@/services/video/utils';
import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { ComponentProps, FC, forwardRef, HTMLAttributes, useEffect, useRef } from 'react';
import { Corner } from '../../assets/icons/Corner';

interface SelectionInputProps {
  currentSubjectId: number;
}

interface WorkingCopy {
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

type SelectionWorkingCopy = WorkingCopy & Selection;

export interface InputProps<T> {
  onChange: (value: T) => void;
  value: T;
}

export const SelectionInput: FC<
  SelectionInputProps & InputProps<Selection[]> & Omit<ComponentProps<'div'>, 'onChange'>
> = ({ currentSubjectId, onChange, value, className, ...props }) => {
  const pending = useRef<SelectionWorkingCopy | null>(null);
  const pendingBoxRef = useRef<HTMLDivElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const abortController = new AbortController();

    node.addEventListener('contextmenu', e => {
      if (!pending.current || !pendingBoxRef.current) return;

      pendingBoxRef.current.style.opacity = '0';
      pending.current = null;
      applyBoundingBoxToElement(pendingBoxRef.current);

      e.stopPropagation();
      e.preventDefault();
    });

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
            subjectId: currentSubjectId,
            boundingBox: {
              id: crypto.randomUUID(),
              x: origin.x,
              y: origin.y,
              width: 0,
              height: 0
            },
            origin: {
              canvas: origin
            },
            state: 'drawing'
          };
        } finally {
          if (!pending.current || !pendingBoxRef.current) return;
          pendingBoxRef.current!.style.opacity = '1';
          applyBoundingBoxToElement(pendingBoxRef.current, pending.current.boundingBox);
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
          if (!pending.current || !pendingBoxRef.current) return;
          applyBoundingBoxToElement(pendingBoxRef.current, pending.current.boundingBox);
        }
      },
      { signal: abortController.signal }
    );
    node.addEventListener(
      'mouseup',
      () => {
        try {
          if (!pending.current) return;
          if (pending.current.boundingBox.width < 0.05 || pending.current.boundingBox.height < 0.05) {
            // If the box is too small, we should remove it.
            return;
          }

          if (!value) return [pending.current!];
          onChange([...value.filter(box => box.boundingBox.id !== pending.current?.boundingBox.id), pending.current]);
        } finally {
          if (!pending.current || !pendingBoxRef.current) return;
          const clickedBoxElement = node.querySelector<HTMLDivElement>(`[data-id="${pending.current.boundingBox.id}"]`);
          if (clickedBoxElement) {
            clickedBoxElement.style.opacity = '1';
          }
          pendingBoxRef.current!.style.opacity = '0';
          pending.current = null;
          applyBoundingBoxToElement(pendingBoxRef.current);
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
            key={`${box.boundingBox.id}-${box.boundingBox.x}-${box.boundingBox.y}`}
            data-id={box.boundingBox.id}
            style={{
              '--custom-color': getColorForId(box.subjectId),
              ...getStyleForBox(box.boundingBox)
            }}
          >
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              className="bg-black bg-opacity-60 text-white flex justify-center items-center p-2 rounded-lg absolute -top-12 right-0 pointer-events-auto"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <SiTrash />
            </motion.button>
          </BoundingBox>
        ))}
      </div>
      <div
        ref={containerRef}
        className={cn('absolute inset-0 z-30', `cursor-editor-${getColorForId(currentSubjectId)}`, className)}
        {...props}
      >
        <BoundingBox
          offset={3}
          style={{ opacity: 0, '--custom-color': getColorForId(currentSubjectId) }}
          className="overflow-clip"
          ref={pendingBoxRef}
        ></BoundingBox>
      </div>
    </>
  );
};

const getStyleForBox = (box: BoundingBox) => {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`
  };
};

const applyBoundingBoxToElement = (element: HTMLDivElement, box?: BoundingBox) => {
  if (!box) {
    const reset = getStyleForBox({ id: 'empty', x: 0, y: 0, width: 0, height: 0 });
    Object.assign(element.style, reset);
    return;
  }
  const style = getStyleForBox(box);
  Object.assign(element.style, style);
};

const updateBoxPositionFromMousePosition = (
  selection: SelectionWorkingCopy,
  x: number,
  y: number
): SelectionWorkingCopy => {
  if (!selection.origin.inner) {
    throw new Error('Box origin inner is undefined');
  }
  return {
    ...selection,
    boundingBox: {
      ...selection.boundingBox,
      x: Math.min(1 - selection.boundingBox.width, Math.max(0, x - selection.origin.inner.x)),
      y: Math.min(1 - selection.boundingBox.height, Math.max(0, y - selection.origin.inner.y))
    }
  };
};

const updateBoxSizeFromMousePosition = (
  selection: SelectionWorkingCopy,
  x: number,
  y: number
): SelectionWorkingCopy => {
  const newX = Math.min(selection.origin.canvas.x, x);
  const newY = Math.min(selection.origin.canvas.y, y);

  const newWidth = Math.min(1, Math.max(0, Math.abs(x - selection.origin.canvas.x)));
  const newHeight = Math.min(1, Math.max(0, Math.abs(y - selection.origin.canvas.y)));

  return {
    ...selection,
    boundingBox: {
      ...selection.boundingBox,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    }
  };
};

interface BoundingBoxProps extends HTMLAttributes<HTMLDivElement> {
  offset?: number;
}
const BoundingBox = forwardRef<HTMLDivElement, BoundingBoxProps>(
  ({ children, className, offset = 6, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('absolute bg-white bg-opacity-10 shadow-md border-2 border-custom text-custom', className)}
        {...props}
      >
        {children}
        <motion.span
          initial={{ left: -2, top: -2 }}
          animate={{ left: -offset, top: -offset }}
          className="absolute z-10"
        >
          <Corner />
        </motion.span>
        <motion.span
          initial={{ right: -2, top: -2 }}
          animate={{ right: -offset, top: -offset }}
          className="absolute z-10"
        >
          <Corner className="rotate-90" />
        </motion.span>
        <motion.span
          initial={{ left: -2, bottom: -2 }}
          animate={{ left: -offset, bottom: -offset }}
          className="absolute z-10"
        >
          <Corner className="-rotate-90" />
        </motion.span>
        <motion.span
          initial={{ right: -2, bottom: -2 }}
          animate={{ right: -offset, bottom: -offset }}
          className="absolute z-10"
        >
          <Corner className="rotate-180" />
        </motion.span>
      </div>
    );
  }
);

interface BoundingBoxViewProps extends HTMLAttributes<HTMLDivElement> {
  boxes: Selection[];
}

export const BoundingBoxView: FC<BoundingBoxViewProps> = ({ boxes, className, ...props }) => {
  return (
    <div className={cn('absolute inset-0 z-10 pointer-events-none', className)} {...props}>
      <AnimatePresence initial={false}>
        {boxes.map(box => (
          <BoundingBox
            offset={6}
            key={box.boundingBox.id}
            style={getStyleForBox(box.boundingBox)}
            className="bg-opacity-0 border-2 border-dashed border-white"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
