import { Square } from '@/components/assets/images/Square';
import { Observation } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ConfirmationImage = Observation['sightings'][number]['images'][number];

export type ConfirmationAnnotationBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ConfirmationAnnotationCanvas = {
  height: number;
  width: number;
};

export interface ConfirmationAnnotation {
  box: ConfirmationAnnotationBox;
  canvas?: ConfirmationAnnotationCanvas;
  key: string;
  imageId: string;
  imageIndex: number;
  shape: string;
  shapeId: string;
  type: AnnotationTool;
}

type AnnotationTool = 'draw';

type AnnotationPoint = {
  x: number;
  y: number;
};

type AnnotationCanvasShape = {
  box: ConfirmationAnnotationBox;
  canvas: ConfirmationAnnotationCanvas;
  path: string;
  points: AnnotationPoint[];
  shapeId: string;
};

type AnnotationCanvasSnapshot = {
  shapes: AnnotationCanvasShape[];
};

type AnnotationShape = {
  box: ConfirmationAnnotationBox;
  canvas: ConfirmationAnnotationCanvas;
  key: string;
  imageId: string;
  shape: string;
  shapeId: string;
  path: string;
  points: AnnotationPoint[];
  type: AnnotationTool;
};

type PendingDelete = {
  imageId: string;
  shapeId: string;
};

const MINIMUM_ANNOTATION_SIZE = 16;

interface ConfirmationAnnotationEditorProps {
  images: ConfirmationImage[];
  annotationError?: string;
  annotationTextByKey: Record<string, string>;
  globalCommentsField?: ReactNode;
  onAnnotationTextChange: (key: string, value: string) => void;
  onAnnotationsChange: (annotations: ConfirmationAnnotation[]) => void;
}

interface AnnotationCanvasProps {
  imageId: string;
  initialSnapshot?: AnnotationCanvasSnapshot;
  pendingDelete: PendingDelete | null;
  onPendingDeleteHandled: () => void;
  onSnapshotChange: (imageId: string, snapshot: AnnotationCanvasSnapshot, shapes: AnnotationShape[]) => void;
}

const isLargeEnoughAnnotation = (box: ConfirmationAnnotationBox) => {
  return Math.max(box.width, box.height) >= MINIMUM_ANNOTATION_SIZE;
};

const ANNOTATION_STROKE_WIDTH = 3.5;
const ANNOTATION_HALO_WIDTH = ANNOTATION_STROKE_WIDTH + 4;
const ANNOTATION_STROKE_COLOR = '#ef9e11';
const ANNOTATION_HALO_COLOR = '#ffffff';

const roundCoordinate = (value: number) => Math.round(value * 10) / 10;

const getAnnotationPoint = (event: React.PointerEvent<SVGSVGElement>, element: SVGSVGElement): AnnotationPoint => {
  const rect = element.getBoundingClientRect();

  return {
    x: roundCoordinate(Math.min(Math.max(event.clientX - rect.left, 0), rect.width)),
    y: roundCoordinate(Math.min(Math.max(event.clientY - rect.top, 0), rect.height))
  };
};

const getAnnotationCanvas = (element: SVGSVGElement): ConfirmationAnnotationCanvas => {
  const rect = element.getBoundingClientRect();

  return {
    height: roundCoordinate(rect.height),
    width: roundCoordinate(rect.width)
  };
};

const getAnnotationBox = (points: AnnotationPoint[]): ConfirmationAnnotationBox | undefined => {
  if (points.length === 0) return undefined;

  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    height: roundCoordinate(maxY - minY),
    width: roundCoordinate(maxX - minX),
    x: roundCoordinate(minX),
    y: roundCoordinate(minY)
  };
};

const pointsToPath = (points: AnnotationPoint[]) => {
  const [firstPoint, ...remainingPoints] = points;
  if (!firstPoint) return '';

  return [`M ${firstPoint.x} ${firstPoint.y}`, ...remainingPoints.map(point => `L ${point.x} ${point.y}`)].join(' ');
};

const getShapeSvg = (shape: AnnotationCanvasShape) => {
  const width = roundCoordinate(shape.box.width + ANNOTATION_HALO_WIDTH);
  const height = roundCoordinate(shape.box.height + ANNOTATION_HALO_WIDTH);
  const viewBox = [shape.box.x - ANNOTATION_HALO_WIDTH / 2, shape.box.y - ANNOTATION_HALO_WIDTH / 2, width, height]
    .map(value => roundCoordinate(value))
    .join(' ');

  return `<svg width="${width}" height="${height}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${shape.path}" stroke="${ANNOTATION_HALO_COLOR}" stroke-width="${ANNOTATION_HALO_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/><path d="${shape.path}" stroke="${ANNOTATION_STROKE_COLOR}" stroke-width="${ANNOTATION_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

const toAnnotationShape = (imageId: string, shape: AnnotationCanvasShape): AnnotationShape => {
  return {
    ...shape,
    key: `${imageId}:${shape.shapeId}`,
    imageId,
    shape: getShapeSvg(shape),
    type: 'draw'
  };
};

const AnnotationCanvas: FC<AnnotationCanvasProps> = ({
  imageId,
  initialSnapshot,
  pendingDelete,
  onPendingDeleteHandled,
  onSnapshotChange
}) => {
  const initialShapes = initialSnapshot?.shapes ?? [];
  const [shapes, setShapes] = useState<AnnotationCanvasShape[]>(initialShapes);
  const shapesRef = useRef<AnnotationCanvasShape[]>(initialShapes);
  const [draftPoints, setDraftPointsState] = useState<AnnotationPoint[] | null>(null);
  const draftPointsRef = useRef<AnnotationPoint[] | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const nextShapeIdRef = useRef(Date.now());

  const setDraftPoints = useCallback((points: AnnotationPoint[] | null) => {
    draftPointsRef.current = points;
    setDraftPointsState(points);
  }, []);

  const syncShapes = useCallback(
    (nextShapes: AnnotationCanvasShape[]) => {
      const snapshot = { shapes: nextShapes };
      onSnapshotChange(
        imageId,
        snapshot,
        nextShapes.map(shape => toAnnotationShape(imageId, shape))
      );
    },
    [imageId, onSnapshotChange]
  );

  const replaceShapes = useCallback(
    (getNextShapes: (currentShapes: AnnotationCanvasShape[]) => AnnotationCanvasShape[]) => {
      const nextShapes = getNextShapes(shapesRef.current);
      shapesRef.current = nextShapes;
      setShapes(nextShapes);
      syncShapes(nextShapes);
    },
    [syncShapes]
  );

  useEffect(() => {
    if (!pendingDelete || pendingDelete.imageId !== imageId) return;

    replaceShapes(currentShapes => currentShapes.filter(shape => shape.shapeId !== pendingDelete.shapeId));
    onPendingDeleteHandled();
  }, [imageId, onPendingDeleteHandled, pendingDelete, replaceShapes]);

  const finishDrawing = useCallback(
    (points: AnnotationPoint[], canvas: ConfirmationAnnotationCanvas) => {
      activePointerIdRef.current = null;

      const box = getAnnotationBox(points);
      if (!box || !isLargeEnoughAnnotation(box)) return;

      const nextShape: AnnotationCanvasShape = {
        box,
        canvas,
        path: pointsToPath(points),
        points,
        shapeId: `shape:${nextShapeIdRef.current++}`
      };

      replaceShapes(currentShapes => [...currentShapes, nextShape]);
    },
    [replaceShapes]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.preventDefault();
      const point = getAnnotationPoint(event, event.currentTarget);
      activePointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraftPoints([point]);
    },
    [setDraftPoints]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      event.preventDefault();
      const point = getAnnotationPoint(event, event.currentTarget);
      const currentPoints = draftPointsRef.current;
      if (!currentPoints) return;

      const previousPoint = currentPoints[currentPoints.length - 1];
      if (previousPoint && previousPoint.x === point.x && previousPoint.y === point.y) return;

      setDraftPoints([...currentPoints, point]);
    },
    [setDraftPoints]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      event.preventDefault();
      const point = getAnnotationPoint(event, event.currentTarget);
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);

      const canvas = getAnnotationCanvas(event.currentTarget);
      const currentPoints = draftPointsRef.current;
      setDraftPoints(null);
      if (currentPoints) finishDrawing([...currentPoints, point], canvas);
    },
    [finishDrawing, setDraftPoints]
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);

      const canvas = getAnnotationCanvas(event.currentTarget);
      const currentPoints = draftPointsRef.current;
      setDraftPoints(null);
      if (currentPoints) finishDrawing(currentPoints, canvas);
    },
    [finishDrawing, setDraftPoints]
  );

  const draftPath = draftPoints ? pointsToPath(draftPoints) : undefined;

  return (
    <svg
      aria-label="draw annotation"
      className="confirmation-annotation-editor absolute inset-0 z-10 size-full touch-none cursor-crosshair"
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {shapes.map(shape => (
        <g key={shape.shapeId} className="confirmation-annotation-shape">
          <path
            d={shape.path}
            className="stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={ANNOTATION_HALO_WIDTH}
          />
          <path
            d={shape.path}
            className="stroke-accent-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={ANNOTATION_STROKE_WIDTH}
          />
        </g>
      ))}
      {draftPath && (
        <g className="confirmation-annotation-shape">
          <path
            d={draftPath}
            className="stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={ANNOTATION_HALO_WIDTH}
          />
          <path
            d={draftPath}
            className="stroke-accent-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={ANNOTATION_STROKE_WIDTH}
          />
        </g>
      )}
    </svg>
  );
};

export const ConfirmationAnnotationEditor: FC<ConfirmationAnnotationEditorProps> = ({
  images,
  annotationError,
  annotationTextByKey,
  globalCommentsField,
  onAnnotationTextChange,
  onAnnotationsChange
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [snapshotsByImageId, setSnapshotsByImageId] = useState<Record<string, AnnotationCanvasSnapshot>>({});
  const [annotationsByImageId, setAnnotationsByImageId] = useState<Record<string, AnnotationShape[]>>({});

  const activeImage = images[activeImageIndex];
  const activeImageId = activeImage?.id.toString();

  const annotations = useMemo(
    () =>
      images.flatMap((image, imageIndex) =>
        (annotationsByImageId[image.id.toString()] ?? []).map(annotation => ({
          ...annotation,
          imageIndex
        }))
      ),
    [annotationsByImageId, images]
  );

  const activeDrawCitations = useMemo(
    () =>
      annotations
        .map((annotation, index) => ({ annotation, number: index + 1 }))
        .filter(({ annotation }) => annotation.imageId === activeImageId && annotation.type === 'draw'),
    [activeImageId, annotations]
  );

  useEffect(() => {
    onAnnotationsChange(annotations);
  }, [annotations, onAnnotationsChange]);

  const handleSnapshotChange = useCallback(
    (imageId: string, snapshot: AnnotationCanvasSnapshot, shapes: AnnotationShape[]) => {
      setSnapshotsByImageId(current => ({ ...current, [imageId]: snapshot }));
      setAnnotationsByImageId(current => ({ ...current, [imageId]: shapes }));
    },
    []
  );

  const goToImage = useCallback(
    (direction: -1 | 1) => {
      setActiveImageIndex(current => (current + direction + images.length) % images.length);
    },
    [images.length]
  );

  const deleteAnnotation = useCallback((annotation: ConfirmationAnnotation) => {
    setActiveImageIndex(annotation.imageIndex);
    setPendingDelete({ imageId: annotation.imageId, shapeId: annotation.shapeId });
  }, []);

  if (!activeImage || !activeImageId) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(300px,460px)_minmax(280px,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden bg-accent-50 shadow-sm">
          <Square
            className="absolute inset-0 h-full w-full select-none"
            draggable={false}
            src={activeImage.url}
            image={{ width: activeImage.width, height: activeImage.height }}
            options={{ extract: activeImage.boundingBox }}
          />
          <AnnotationCanvas
            key={activeImageId}
            imageId={activeImageId}
            initialSnapshot={snapshotsByImageId[activeImageId]}
            pendingDelete={pendingDelete}
            onPendingDeleteHandled={() => setPendingDelete(null)}
            onSnapshotChange={handleSnapshotChange}
          />
          {activeDrawCitations.map(({ annotation, number }) => (
            <span
              key={annotation.key}
              className="pointer-events-none absolute z-20 flex h-7 min-w-7 items-center justify-center rounded-md border-2 border-accent-800 bg-accent-50 px-1.5 text-sm font-black leading-none text-accent-900 shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
              style={{
                left: `${annotation.box.x + annotation.box.width}px`,
                top: `${annotation.box.y}px`,
                transform: 'translate(-65%, -35%)'
              }}
            >
              {number}
            </span>
          ))}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="previous image"
                onClick={() => goToImage(-1)}
                className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-accent-300 bg-accent-50/90 text-accent-900 shadow-sm transition-colors hover:bg-accent-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="next image"
                onClick={() => goToImage(1)}
                className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-accent-300 bg-accent-50/90 text-accent-900 shadow-sm transition-colors hover:bg-accent-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`image ${index + 1}`}
                onClick={() => setActiveImageIndex(index)}
                className={cn(
                  'h-2.5 w-2.5 rounded-full border border-accent-500 transition-colors',
                  index === activeImageIndex ? 'bg-accent-700' : 'bg-accent-50'
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="border-b border-accent-300 pb-3 text-lg font-semibold text-accent-800">Annotation notes</div>
        <div className="flex flex-col gap-3 py-4 pr-1">
          {annotations.length === 0 ? (
            <p className="text-sm font-medium text-accent-800/70">No annotations yet</p>
          ) : (
            annotations.map((annotation, index) => (
              <div key={annotation.key} className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-start gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-accent-800 text-sm font-black text-accent-900">
                  {index + 1}
                </span>
                <textarea
                  aria-label={`annotation ${index + 1} note`}
                  placeholder="What should people notice?"
                  value={annotationTextByKey[annotation.key] ?? ''}
                  onChange={event => onAnnotationTextChange(annotation.key, event.target.value)}
                  className="min-h-16 w-full resize-none rounded-md border border-accent-300 bg-accent-50 px-3 py-2 text-sm font-semibold leading-5 text-accent-900 outline-none placeholder:text-accent-900/45 focus:border-accent-700"
                />
                <button
                  type="button"
                  aria-label={`delete annotation ${index + 1}`}
                  onClick={() => deleteAnnotation(annotation)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-accent-800 transition-colors hover:bg-accent-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
        {annotationError && (
          <p className="border-t border-accent-300 pt-3 text-sm font-bold text-red-700">{annotationError}</p>
        )}
        {globalCommentsField && <div className="border-t border-accent-300 pt-4">{globalCommentsField}</div>}
      </div>
    </div>
  );
};
