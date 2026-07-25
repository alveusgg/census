import SiTrash from '@/components/icons/SiTrash';
import type { BoundingBox, Selection } from '@/services/video/CaptureEditorProvider';
import { getColorForId } from '@/services/video/utils';
import { cn } from '@/utils/cn';
import { createId } from '@/utils/id';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ComponentProps,
  FC,
  forwardRef,
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef
} from 'react';
import { toast } from 'sonner';
import { Corner } from '../../assets/icons/Corner';

export interface InputProps<T> {
  onChange: (value: T) => void;
  value: T;
}

interface SelectionInputProps {
  currentSubjectId: number;
}

type DragMode = 'drawing' | 'editing';

interface DragOrigin {
  // Position on the canvas (0-1) where the drag started
  canvas: { x: number; y: number };
  // Offset inside the box (0-1) where the drag started, only set when editing
  inner?: { x: number; y: number };
}

interface PendingSelection extends Selection {
  origin: DragOrigin;
  mode: DragMode;
}

const MIN_BOX_WIDTH = 0.05;
const MIN_BOX_HEIGHT = 0.3;
const BOX_TOO_SMALL_MESSAGE = 'That box was too small, please try again!';

export const SelectionInput: FC<
  SelectionInputProps & InputProps<Selection[]> & Omit<ComponentProps<'div'>, 'onChange'>
> = ({ currentSubjectId, onChange, value, className, ...props }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingBoxRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<PendingSelection | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);

  // Mirror the latest value/onChange in refs so drag handlers (registered on
  // pointerdown and kept alive on `document` until pointerup) never act on a
  // stale snapshot if the component re-renders mid-drag.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const getNormalizedPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    };
  };

  const showPendingBox = (box: BoundingBox) => {
    const el = pendingBoxRef.current;
    if (!el) return;
    el.style.opacity = '1';
    applyBoundingBoxToElement(el, box);
  };

  const hidePendingBox = () => {
    const el = pendingBoxRef.current;
    if (!el) return;
    el.style.opacity = '0';
    applyBoundingBoxToElement(el);
  };

  const cancelPending = () => {
    cleanupDragRef.current?.();
    cleanupDragRef.current = null;
    pendingRef.current = null;
    hidePendingBox();
  };

  useEffect(() => {
    return () => cleanupDragRef.current?.();
  }, []);

  const startDrag = (initial: PendingSelection, pointerId: number, onRelease?: () => void) => {
    pendingRef.current = initial;
    showPendingBox(initial.boundingBox);

    const handleMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const current = pendingRef.current;
      if (!current) return;
      event.preventDefault();
      const point = getNormalizedPoint(event.clientX, event.clientY);
      const next =
        current.mode === 'editing' && current.origin.inner
          ? moveBox(current, point.x, point.y)
          : resizeBox(current, point.x, point.y);
      pendingRef.current = next;
      if (pendingBoxRef.current) applyBoundingBoxToElement(pendingBoxRef.current, next.boundingBox);
    };

    const cleanup = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleCancel);
      onRelease?.();
    };

    const handleCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      cleanup();
      cleanupDragRef.current = null;
      pendingRef.current = null;
      hidePendingBox();
    };

    const handleUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      cleanup();
      cleanupDragRef.current = null;
      const finished = pendingRef.current;
      pendingRef.current = null;
      hidePendingBox();

      if (!finished) return;
      const { boundingBox } = finished;
      if (boundingBox.width < MIN_BOX_WIDTH || boundingBox.height < MIN_BOX_HEIGHT) {
        toast(BOX_TOO_SMALL_MESSAGE);
        return;
      }

      // Only one selection per subject per frame, so replace by subjectId.
      const existing = valueRef.current ?? [];
      const next = [
        ...existing.filter(s => s.subjectId !== finished.subjectId),
        { subjectId: finished.subjectId, boundingBox }
      ];
      onChangeRef.current(next);
    };

    cleanupDragRef.current = cleanup;
    document.addEventListener('pointermove', handleMove, { passive: false });
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleCancel);
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if (pendingRef.current) return;

    const origin = getNormalizedPoint(event.clientX, event.clientY);
    startDrag({
      subjectId: currentSubjectId,
      boundingBox: { id: createId(), x: origin.x, y: origin.y, width: 0, height: 0 },
      origin: { canvas: origin },
      mode: 'drawing'
    }, event.pointerId);
    event.preventDefault();
  };

  const handleBoxPointerDown = (selection: Selection) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if (pendingRef.current) return;

    const origin = getNormalizedPoint(event.clientX, event.clientY);
    const inner = { x: origin.x - selection.boundingBox.x, y: origin.y - selection.boundingBox.y };

    const boxEl = event.currentTarget as HTMLDivElement;
    boxEl.style.opacity = '0';

    startDrag(
      {
        subjectId: selection.subjectId,
        boundingBox: { ...selection.boundingBox },
        origin: { canvas: origin, inner },
        mode: 'editing'
      },
      event.pointerId,
      () => {
        boxEl.style.opacity = '1';
      }
    );

    event.stopPropagation();
    event.preventDefault();
  };

  const handleRemove = (selection: Selection) => (event: ReactMouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onChange((value ?? []).filter(s => s.subjectId !== selection.subjectId));
  };

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!pendingRef.current) return;
    cancelPending();
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-40 touch-none select-none">
        {value.map(selection => (
          <BoundingBox
            key={selection.boundingBox.id}
            data-id={selection.boundingBox.id}
            className="pointer-events-auto cursor-move"
            style={{
              '--custom-color': getColorForId(selection.subjectId),
              ...getStyleForBox(selection.boundingBox)
            }}
            onPointerDown={handleBoxPointerDown(selection)}
          >
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              aria-label="Remove box"
              className="pointer-events-auto absolute -top-12 right-0 flex size-11 items-center justify-center rounded-lg bg-black bg-opacity-60 text-white sm:size-auto sm:p-2"
              onPointerDown={event => event.stopPropagation()}
              onClick={handleRemove(selection)}
            >
              <SiTrash />
            </motion.button>
          </BoundingBox>
        ))}
      </div>
      <div
        ref={containerRef}
        className={cn(
          'absolute inset-0 z-30 touch-none select-none',
          `cursor-editor-${getColorForId(currentSubjectId)}`,
          className
        )}
        onPointerDown={handleCanvasPointerDown}
        onContextMenu={handleContextMenu}
        {...props}
      >
        <BoundingBox
          offset={3}
          style={{ opacity: 0, '--custom-color': getColorForId(currentSubjectId) }}
          className="overflow-clip"
          ref={pendingBoxRef}
        />
      </div>
    </>
  );
};

const getStyleForBox = (box: BoundingBox) => ({
  left: `${box.x * 100}%`,
  top: `${box.y * 100}%`,
  width: `${box.width * 100}%`,
  height: `${box.height * 100}%`
});

const applyBoundingBoxToElement = (element: HTMLDivElement, box?: BoundingBox) => {
  const target = box ?? { id: 'empty', x: 0, y: 0, width: 0, height: 0 };
  Object.assign(element.style, getStyleForBox(target));
};

const moveBox = (pending: PendingSelection, x: number, y: number): PendingSelection => {
  if (!pending.origin.inner) throw new Error('Cannot move box without inner origin');
  const { width, height } = pending.boundingBox;
  return {
    ...pending,
    boundingBox: {
      ...pending.boundingBox,
      x: Math.min(1 - width, Math.max(0, x - pending.origin.inner.x)),
      y: Math.min(1 - height, Math.max(0, y - pending.origin.inner.y))
    }
  };
};

const resizeBox = (pending: PendingSelection, x: number, y: number): PendingSelection => {
  const { canvas } = pending.origin;
  return {
    ...pending,
    boundingBox: {
      ...pending.boundingBox,
      x: Math.min(canvas.x, x),
      y: Math.min(canvas.y, y),
      width: Math.min(1, Math.abs(x - canvas.x)),
      height: Math.min(1, Math.abs(y - canvas.y))
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
