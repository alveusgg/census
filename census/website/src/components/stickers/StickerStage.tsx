import type { CSSProperties, JSX } from 'react';

import hideoutBackground from './hideout.svg?url';
import { useStickerStage } from './hooks';
import { Sticker } from './Sticker';
import type { StickerBoardProps } from './types';

export const StickerStage = <Id extends string>({
  stickers,
  mode = 'interactive',
  effects = true,
  boardLabel = 'Sticker board',
  className,
  style,
  referenceSize,
  peel,
  onChange,
  onDragEnd,
  value
}: StickerBoardProps<Id>): JSX.Element => {
  const interactive = mode === 'interactive';

  const { positions, stageRef, registerHandle, handlePointerDown } = useStickerStage({
    stickers,
    mode,
    effectsEnabled: effects,
    referenceSize,
    onChange,
    onDragEnd,
    value
  });

  const stageStyle: CSSProperties | undefined = interactive
    ? {
        ...style,
        backgroundImage: `url(${hideoutBackground})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '30px 30px',
        borderRadius: '8px',
        outline: '1px solid #b0550d40'
      }
    : style;

  return (
    <div
      ref={stageRef}
      className={`relative overflow-hidden${className ? ` ${className}` : ''}`}
      style={stageStyle}
      aria-label={boardLabel}
    >
      {stickers.map(sticker => (
        <Sticker
          key={sticker.id}
          sticker={sticker}
          position={positions[sticker.id]}
          interactive={interactive}
          effectsEnabled={effects}
          peel={peel}
          onPointerDown={handlePointerDown}
          registerHandle={registerHandle}
        />
      ))}
    </div>
  );
};
