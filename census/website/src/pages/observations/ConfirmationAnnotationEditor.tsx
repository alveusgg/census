import { Square } from '@/components/assets/images/Square';
import { Observation } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DefaultColorStyle,
  DefaultSizeStyle,
  Editor,
  TLEditorSnapshot,
  TLShape,
  TLShapeId,
  Tldraw,
  track,
  useEditor
} from 'tldraw';
import 'tldraw/tldraw.css';

export type ConfirmationImage = Observation['sightings'][number]['images'][number];

export interface ConfirmationAnnotation {
  key: string;
  imageId: string;
  imageIndex: number;
  shapeId: string;
  type: AnnotationTool;
}

type AnnotationTool = 'draw' | 'arrow';

type AnnotationShape = {
  key: string;
  imageId: string;
  shapeId: string;
  type: AnnotationTool;
};

type PendingDelete = {
  imageId: string;
  shapeId: string;
};

interface ConfirmationAnnotationEditorProps {
  images: ConfirmationImage[];
  annotationError?: string;
  annotationTextByKey: Record<string, string>;
  onAnnotationTextChange: (key: string, value: string) => void;
  onAnnotationsChange: (annotations: ConfirmationAnnotation[]) => void;
}

interface AnnotationCanvasProps {
  imageId: string;
  initialSnapshot?: TLEditorSnapshot;
  pendingDelete: PendingDelete | null;
  tool: AnnotationTool;
  onPendingDeleteHandled: () => void;
  onSnapshotChange: (imageId: string, snapshot: TLEditorSnapshot, shapes: AnnotationShape[]) => void;
}

const isAnnotationShape = (shape: TLShape): shape is TLShape & { type: AnnotationTool } => {
  return shape.type === 'draw' || shape.type === 'arrow';
};

const getAnnotationShapes = (imageId: string, editor: Editor): AnnotationShape[] => {
  return editor
    .getCurrentPageShapesSorted()
    .filter(isAnnotationShape)
    .map(shape => ({
      key: `${imageId}:${shape.id}`,
      imageId,
      shapeId: shape.id,
      type: shape.type
    }));
};

const ToolController = track(({ tool }: { tool: AnnotationTool }) => {
  const editor = useEditor();

  useEffect(() => {
    editor.setCurrentTool(tool);
  }, [editor, tool]);

  return null;
});

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
  tool,
  onPendingDeleteHandled,
  onSnapshotChange
}) => {
  const initialSnapshotRef = useRef(initialSnapshot);

  const syncCanvas = useCallback(
    (editor: Editor) => {
      const unsupportedShapes = editor
        .getCurrentPageShapes()
        .filter(shape => !isAnnotationShape(shape))
        .map(shape => shape.id);

      if (unsupportedShapes.length > 0) {
        editor.deleteShapes(unsupportedShapes);
        return;
      }

      onSnapshotChange(imageId, editor.getSnapshot(), getAnnotationShapes(imageId, editor));
    },
    [imageId, onSnapshotChange]
  );

  const handleMount = useCallback(
    (editor: Editor) => {
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
      editor.setCurrentTool(tool);
      syncCanvas(editor);

      return editor.store.listen(() => syncCanvas(editor), { source: 'user', scope: 'all' });
    },
    [syncCanvas, tool]
  );

  return (
    <Tldraw
      hideUi
      autoFocus={false}
      className="confirmation-annotation-editor absolute inset-0 z-10"
      initialState={tool}
      snapshot={initialSnapshotRef.current}
      onMount={handleMount}
    >
      <ToolController tool={tool} />
      <PendingDeleteController imageId={imageId} pendingDelete={pendingDelete} onHandled={onPendingDeleteHandled} />
    </Tldraw>
  );
};

const ToolButton = ({
  children,
  icon,
  selected,
  title,
  onClick
}: {
  children: string;
  icon: ReactNode;
  selected: boolean;
  title: string;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center justify-center gap-2 rounded-md border border-accent-300 px-3 text-sm font-bold text-accent-900 transition-colors',
        selected ? 'bg-accent-400 shadow-inner' : 'bg-accent-100 hover:bg-accent-200'
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export const ConfirmationAnnotationEditor: FC<ConfirmationAnnotationEditorProps> = ({
  images,
  annotationError,
  annotationTextByKey,
  onAnnotationTextChange,
  onAnnotationsChange
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [tool, setTool] = useState<AnnotationTool>('draw');
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
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,520px)_minmax(280px,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <ToolButton
            title="Draw"
            selected={tool === 'draw'}
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => setTool('draw')}
          >
            Draw
          </ToolButton>
          <ToolButton
            title="Arrow"
            selected={tool === 'arrow'}
            icon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() => setTool('arrow')}
          >
            Arrow
          </ToolButton>
        </div>
        <div className="relative aspect-square w-full overflow-hidden bg-white shadow-sm">
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
            tool={tool}
            onPendingDeleteHandled={() => setPendingDelete(null)}
            onSnapshotChange={handleSnapshotChange}
          />
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
        <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto py-4 pr-1">
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
                  className="min-h-16 w-full resize-none rounded-md border border-accent-300 bg-accent-50 px-3 py-2 text-base font-semibold leading-snug text-accent-900 outline-none placeholder:text-accent-900/45 focus:border-accent-700"
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
      </div>
    </div>
  );
};
