import { Button } from '@/components/controls/button/blueprint';
import SiCheckCircle from '@/components/icons/SiCheckCircle';
import SiSticker from '@/components/icons/SiSticker';
import {
  StickerSilhouette,
  StickerSpec,
  StickerStage,
  StickerValueMap,
  createStickerValueMap
} from '@/components/stickers';
import { UserLink } from '@/components/users/UserLink';
import { useMeasure } from '@uidotdev/usehooks';
import { FC, useEffect, useMemo, useState } from 'react';

interface ProfileStickerStageProps {
  userId?: number;
  username: string;
  editable?: boolean;
  stickers?: StickerSpec[];
  initialValue?: StickerValueMap;
  onChange?: (value: StickerValueMap) => void;
}

export const parseSilhouette = (svgSource: string): StickerSilhouette => {
  const viewBoxMatch = svgSource.match(/viewBox="([^"]+)"/);
  const pathMatch = svgSource.match(/<path d="([^"]+)"/);

  if (!viewBoxMatch || !pathMatch) {
    throw new Error('Unable to parse silhouette SVG metadata');
  }

  const viewBox = viewBoxMatch[1];
  const path = pathMatch[1];

  if (!viewBox || !path) {
    throw new Error('Silhouette SVG metadata is incomplete');
  }

  const [, , widthValue, heightValue] = viewBox.split(/\s+/);
  const width = Number(widthValue);
  const height = Number(heightValue);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('Unable to parse silhouette SVG dimensions');
  }

  return {
    height,
    path,
    viewBox,
    width
  };
};

export const createSticker = ({
  id,
  label,
  imageSrc,
  silhouette,
  width,
  height,
  rotation
}: {
  id: string;
  label: string;
  imageSrc: string;
  silhouette: StickerSilhouette;
  width: number;
  height: number;
  rotation: string;
}): StickerSpec => ({
  id,
  label,
  initialValue: {
    width,
    height
  },
  geometry: {
    rotation
  },
  artwork: {
    imageAlt: `${label} sticker artwork`,
    imageSrc,
    silhouette
  }
});

export const ProfileStickerStage: FC<ProfileStickerStageProps> = ({
  userId,
  username,
  editable = false,
  stickers = [],
  initialValue,
  onChange
}) => {
  const initialStageValue = useMemo(() => createStickerValueMap(stickers, initialValue), [stickers, initialValue]);
  const [value, setValue] = useState<StickerValueMap>(initialStageValue);
  const [mode, setMode] = useState<'interactive' | 'static'>('static');

  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const activeMode = editable ? mode : 'static';

  useEffect(() => {
    setValue(initialStageValue);
  }, [initialStageValue]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div ref={ref} className="@container w-full relative">
        <StickerStage
          stickers={stickers}
          mode={activeMode}
          onDragEnd={onChange}
          style={{ width: width ?? 0, height: 300 }}
          referenceSize={{ width: 800, height: 300 }}
          peel={{ hover: 0.2, drag: 0.3 }}
          value={value}
          onChange={editable ? setValue : undefined}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="bg-accent-100 px-8 py-6 rounded-lg text-accent-900 font-bold [font-size:clamp(2rem,7.5cqw,3.75rem)]">
            {userId ? (
              <UserLink user={{ id: userId, username }} className="pointer-events-auto" />
            ) : (
              username
            )}
          </h2>
        </div>
      </div>
      {editable && (
        <Button
          variant="primary"
          className="self-start"
          onClick={() => setMode(m => (m === 'interactive' ? 'static' : 'interactive'))}
        >
          {mode === 'static' ? <SiSticker className="text-xl" /> : <SiCheckCircle className="text-xl" />}
          <span>{mode === 'static' ? 'rearrange your stickers' : 'lock your stickers in place'}</span>
        </Button>
      )}
    </div>
  );
};
