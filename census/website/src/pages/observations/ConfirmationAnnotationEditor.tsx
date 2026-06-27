import { Square } from '@/components/assets/images/Square';
import { Observation } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DefaultColorStyle,
  DefaultSizeStyle,
  Editor,
  TLDrawShape,
  TLEditorSnapshot,
  TLShape,
  TLShapeId,
  Tldraw,
  useEditor
} from 'tldraw';
import 'tldraw/tldraw.css';

export type ConfirmationImage = Observation['sightings'][number]['images'][number];

export type ConfirmationAnnotationBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export interface ConfirmationAnnotation {
  box: ConfirmationAnnotationBox;
  key: string;
  imageId: string;
  imageIndex: number;
  shape: string;
  shapeId: string;
  type: AnnotationTool;
}

type AnnotationTool = 'draw';

type AnnotationShape = {
  box: ConfirmationAnnotationBox;
  key: string;
  imageId: string;
  shape: string;
  shapeId: string;
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
  initialSnapshot?: TLEditorSnapshot;
  pendingDelete: PendingDelete | null;
  onPendingDeleteHandled: () => void;
  onSnapshotChange: (imageId: string, snapshot: TLEditorSnapshot, shapes: AnnotationShape[]) => void;
}

const isAnnotationShape = (shape: TLShape): shape is TLDrawShape & { type: AnnotationTool } => {
  return shape.type === 'draw';
};

const isPresent = <T,>(value: T | undefined): value is T => value !== undefined;

const isCompleteAnnotationShape = (shape: TLShape): shape is TLDrawShape & { type: AnnotationTool } => {
  return isAnnotationShape(shape) && shape.props.isComplete;
};

const getAnnotationBox = (editor: Editor, shape: TLDrawShape): ConfirmationAnnotationBox | undefined => {
  const bounds = editor.getShapePageBounds(shape);
  if (!bounds) return undefined;

  return {
    height: bounds.h,
    width: bounds.w,
    x: bounds.x,
    y: bounds.y
  };
};

const isLargeEnoughAnnotation = (box: ConfirmationAnnotationBox) => {
  return Math.max(box.width, box.height) >= MINIMUM_ANNOTATION_SIZE;
};

const deleteSmallCompletedAnnotations = (editor: Editor) => {
  const shapeIds = editor
    .getCurrentPageShapes()
    .filter(isCompleteAnnotationShape)
    .filter(shape => {
      const box = getAnnotationBox(editor, shape);
      return !box || !isLargeEnoughAnnotation(box);
    })
    .map(shape => shape.id);

  if (shapeIds.length === 0) return false;
  editor.deleteShapes(shapeIds);
  return true;
};

const getAnnotationShapes = async (imageId: string, editor: Editor): Promise<AnnotationShape[]> => {
  const shapes = editor.getCurrentPageShapesSorted().filter(isCompleteAnnotationShape);
  const annotations = await Promise.all(
    shapes.map(async drawShape => {
      const box = getAnnotationBox(editor, drawShape);
      if (!box || !isLargeEnoughAnnotation(box)) return undefined;

      const svg = await editor.getSvgString([drawShape.id], { background: false, padding: 'auto', scale: 1 });
      if (!svg) return undefined;

      return {
        box,
        key: `${imageId}:${drawShape.id}`,
        imageId,
        shape: svg.svg,
        shapeId: drawShape.id,
        type: drawShape.type
      };
    })
  );

  return annotations.filter(isPresent);
};

const PendingDeleteController = ({
  pendingDelete,
  imageId,
  onHandled
}: {
  pendingDelete: PendingDelete | null;
  imageId: string;
  onHandled: () => void;
}) => {
  const editor = useEditor();

  useEffect(() => {
    if (!pendingDelete || pendingDelete.imageId !== imageId) return;
    editor.deleteShapes([pendingDelete.shapeId as TLShapeId]);
    onHandled();
  }, [editor, imageId, onHandled, pendingDelete]);

  return null;
};

const AnnotationCanvas: FC<AnnotationCanvasProps> = ({
  imageId,
  initialSnapshot,
  pendingDelete,
  onPendingDeleteHandled,
  onSnapshotChange
}) => {
  const initialSnapshotRef = useRef(initialSnapshot);
  const editorRef = useRef<Editor | null>(null);
  const syncVersionRef = useRef(0);

  const syncCanvas = useCallback(
    (editor: Editor, options?: { force?: boolean }) => {
      if (!options?.force && editor.inputs.getIsDragging()) return;

      const syncVersion = ++syncVersionRef.current;
      const unsupportedShapes = editor
        .getCurrentPageShapes()
        .filter(shape => !isAnnotationShape(shape))
        .map(shape => shape.id);

      if (unsupportedShapes.length > 0) {
        editor.deleteShapes(unsupportedShapes);
        queueMicrotask(() => syncCanvas(editor, { force: true }));
        return;
      }

      if (deleteSmallCompletedAnnotations(editor)) {
        queueMicrotask(() => syncCanvas(editor, { force: true }));
        return;
      }

      const snapshot = editor.getSnapshot();
      void getAnnotationShapes(imageId, editor)
        .then(shapes => {
          if (syncVersion !== syncVersionRef.current) return;
          onSnapshotChange(imageId, snapshot, shapes);
        })
        .catch(error => {
          console.error('Failed to export confirmation annotation SVGs', error);
        });
    },
    [imageId, onSnapshotChange]
  );

  const syncAfterPointerUp = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    requestAnimationFrame(() => {
      if (editorRef.current === editor) syncCanvas(editor, { force: true });
    });
  }, [syncCanvas]);

  useEffect(() => {
    window.addEventListener('pointerup', syncAfterPointerUp);
    window.addEventListener('pointercancel', syncAfterPointerUp);

    return () => {
      window.removeEventListener('pointerup', syncAfterPointerUp);
      window.removeEventListener('pointercancel', syncAfterPointerUp);
    };
  }, [syncAfterPointerUp]);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      editor.setCamera({ x: 0, y: 0, z: 1 }, { force: true, immediate: true });
      editor.setCameraOptions({
        isLocked: true,
        panSpeed: 0,
        wheelBehavior: 'none',
        zoomSpeed: 0,
        zoomSteps: [1]
      });
      editor.setStyleForNextShapes(DefaultColorStyle, 'orange');
      editor.setStyleForNextShapes(DefaultSizeStyle, 'm');
      editor.setCurrentTool('draw');
      syncCanvas(editor);

      const cleanup = editor.store.listen(() => syncCanvas(editor), { source: 'user', scope: 'all' });

      return () => {
        if (editorRef.current === editor) editorRef.current = null;
        cleanup();
      };
    },
    [syncCanvas]
  );

  return (
    <Tldraw
      hideUi
      autoFocus={false}
      className="confirmation-annotation-editor absolute inset-0 z-10"
      initialState="draw"
      snapshot={initialSnapshotRef.current}
      onMount={handleMount}
    >
      <PendingDeleteController imageId={imageId} pendingDelete={pendingDelete} onHandled={onPendingDeleteHandled} />
    </Tldraw>
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
  const [snapshotsByImageId, setSnapshotsByImageId] = useState<Record<string, TLEditorSnapshot>>({});
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

  const handleSnapshotChange = useCallback((imageId: string, snapshot: TLEditorSnapshot, shapes: AnnotationShape[]) => {
    setSnapshotsByImageId(current => ({ ...current, [imageId]: snapshot }));
    setAnnotationsByImageId(current => ({ ...current, [imageId]: shapes }));
  }, []);

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
        <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden bg-white shadow-sm">
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
