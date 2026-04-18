import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type {
  StickerBoardReferenceSize,
  StickerDragState,
  StickerHandle,
  StickerPositionMap,
  StickerSpec,
  StickerValue,
  StickerValueMap
} from './types';

type StageSize = {
  readonly height: number;
  readonly width: number;
};

type UseStickerStageArgs<Id extends string> = {
  readonly stickers: readonly StickerSpec<Id>[];
  readonly mode: 'interactive' | 'static';
  readonly effectsEnabled: boolean;
  readonly referenceSize?: StickerBoardReferenceSize;
  readonly onChange?: (value: StickerValueMap<Id>) => void;
  readonly onDragEnd?: (value: StickerValueMap<Id>, stickerId: Id) => void;
  readonly value: StickerValueMap<Id>;
};

type UseStickerStageResult<Id extends string> = {
  readonly positions: StickerPositionMap<Id>;
  readonly stageRef: (node: HTMLDivElement | null) => void;
  readonly registerHandle: (stickerId: Id, handle: StickerHandle<Id> | null) => void;
  readonly handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>, stickerId: Id) => void;
};

const clamp = (value: number): number => Math.min(Math.max(value, 0), 1);
const ROTATION_STEP_DEGREES = 5;

const getSizeScale = (stageSize: StageSize, referenceSize?: StickerBoardReferenceSize): number =>
  referenceSize ? Math.min(stageSize.width / referenceSize.width, stageSize.height / referenceSize.height) : 1;

const getHighestZIndex = <Id extends string>(valueMap: StickerValueMap<Id>, minimum: number): number =>
  Math.max(...(Object.values(valueMap) as StickerValue[]).map(layout => layout.zIndex), minimum);

const buildPositions = <Id extends string>(
  stickers: readonly StickerSpec<Id>[],
  currentValue: StickerValueMap<Id>,
  stageSize: StageSize,
  referenceSize?: StickerBoardReferenceSize
): StickerPositionMap<Id> =>
  Object.fromEntries(
    stickers.map(sticker => {
      const layout = currentValue[sticker.id];
      const sizeScale = getSizeScale(stageSize, referenceSize);
      const scaledWidth = Math.round(layout.width * sizeScale);
      const scaledHeight = Math.round(layout.height * sizeScale);
      const maxX = Math.max(stageSize.width - scaledWidth, 0);
      const maxY = Math.max(stageSize.height - scaledHeight, 0);

      return [
        sticker.id,
        {
          height: scaledHeight,
          rotation: layout.rotation,
          width: scaledWidth,
          x: maxX * layout.x,
          y: maxY * layout.y,
          zIndex: layout.zIndex
        }
      ];
    })
  ) as StickerPositionMap<Id>;

const useStageSize = (): [StageSize, (node: HTMLDivElement | null) => void, React.RefObject<HTMLDivElement | null>] => {
  const [stageSize, setStageSize] = useState<StageSize>({ height: 0, width: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageObserverRef = useRef<ResizeObserver | null>(null);

  const setStageRef = useCallback((node: HTMLDivElement | null): void => {
    stageObserverRef.current?.disconnect();
    stageObserverRef.current = null;
    stageRef.current = node;

    if (!node) {
      setStageSize({ height: 0, width: 0 });
      return;
    }

    const updateStageSize = (): void => {
      const rect = node.getBoundingClientRect();
      setStageSize({ height: rect.height, width: rect.width });
    };

    updateStageSize();

    const observer = new ResizeObserver(updateStageSize);
    observer.observe(node);
    stageObserverRef.current = observer;
  }, []);

  return [stageSize, setStageRef, stageRef];
};

const useGlobalPointerListeners = (
  handlePointerMove: (event: PointerEvent) => void,
  handlePointerUp: (event: PointerEvent) => void
): void => {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => handlePointerMove(event);
    const onPointerUp = (event: PointerEvent): void => handlePointerUp(event);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);
};

const useGlobalRotateShortcut = (handleRotate: (event: KeyboardEvent) => void): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => handleRotate(event);

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleRotate]);
};

export const useStickerStage = <Id extends string>({
  stickers,
  mode,
  effectsEnabled,
  referenceSize,
  onChange,
  onDragEnd,
  value
}: UseStickerStageArgs<Id>): UseStickerStageResult<Id> => {
  const interactive = mode === 'interactive';
  const [stageSize, setStageRef, stageRef] = useStageSize();
  const dragStateRef = useRef<StickerDragState<Id> | null>(null);
  const highestZIndexRef = useRef(getHighestZIndex(value, 1000 + stickers.length));
  const handlesRef = useRef(new Map<Id, StickerHandle<Id>>());

  if (!interactive && dragStateRef.current) {
    dragStateRef.current = null;
  }

  // The board keeps z-order derived from the current value map so controlled
  // consumers can persist and restore stacking without separate internal state.
  highestZIndexRef.current = getHighestZIndex(value, 1000 + stickers.length);

  const positions = useMemo(
    () => buildPositions(stickers, value, stageSize, referenceSize),
    [referenceSize, value, stageSize, stickers]
  );

  const updateValue = useCallback(
    (nextValue: StickerValueMap<Id>) => {
      onChange?.(nextValue);
    },
    [onChange]
  );

  const registerHandle = (stickerId: Id, handle: StickerHandle<Id> | null): void => {
    if (handle) {
      handlesRef.current.set(stickerId, handle);
      return;
    }

    handlesRef.current.delete(stickerId);
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!interactive) {
        return;
      }

      // Pointer listeners live on window so dragging keeps working even when the
      // cursor leaves the sticker or stage bounds.
      const dragState = dragStateRef.current;
      const stage = stageRef.current;
      if (!dragState || !stage) {
        return;
      }

      const handle = handlesRef.current.get(dragState.stickerId);
      if (effectsEnabled) {
        handle?.updateLightPosition(event.clientX, event.clientY);
      }

      const stageRect = stage.getBoundingClientRect();
      const layout = value[dragState.stickerId];
      const sizeScale = getSizeScale(stageRect, referenceSize);
      const scaledWidth = Math.round(layout.width * sizeScale);
      const scaledHeight = Math.round(layout.height * sizeScale);
      const maxX = Math.max(stageRect.width - scaledWidth, 0);
      const maxY = Math.max(stageRect.height - scaledHeight, 0);
      const nextX = maxX === 0 ? 0 : clamp((event.clientX - stageRect.left - dragState.offsetX) / maxX);
      const nextY = maxY === 0 ? 0 : clamp((event.clientY - stageRect.top - dragState.offsetY) / maxY);

      updateValue({
        ...value,
        [dragState.stickerId]: {
          ...layout,
          x: nextX,
          y: nextY
        }
      });
    },
    [interactive, effectsEnabled, value, referenceSize, stageRef, dragStateRef, updateValue]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      if (!interactive) {
        return;
      }

      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      onDragEnd?.(value, dragState.stickerId);
      dragStateRef.current = null;
    },
    [interactive, value, onDragEnd]
  );

  useGlobalPointerListeners(handlePointerMove, handlePointerUp);

  const handleRotateKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!interactive || event.key.toLowerCase() !== 'r') {
        return;
      }

      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      event.preventDefault();

      const rotationDelta = event.shiftKey ? -ROTATION_STEP_DEGREES : ROTATION_STEP_DEGREES;

      updateValue({
        ...value,
        [dragState.stickerId]: {
          ...value[dragState.stickerId],
          rotation: value[dragState.stickerId].rotation + rotationDelta
        }
      });
    },
    [interactive, value, updateValue]
  );

  useGlobalRotateShortcut(handleRotateKeyDown);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, stickerId: Id): void => {
    if (!interactive) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      stickerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    highestZIndexRef.current += 1;
    const zIndex = highestZIndexRef.current;

    updateValue({
      ...value,
      [stickerId]: {
        ...value[stickerId],
        zIndex
      }
    });
  };

  return {
    positions,
    stageRef: setStageRef,
    registerHandle,
    handlePointerDown
  };
};
