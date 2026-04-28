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
import { useMeasure } from '@uidotdev/usehooks';
import { FC, useState } from 'react';

interface ProfileStickerStageProps {
  username: string;
  editable?: boolean;
}

const parseSilhouette = (svgSource: string): StickerSilhouette => {
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

const stickers: StickerSpec<string>[] = [];

export const ProfileStickerStage: FC<ProfileStickerStageProps> = ({ username, editable = false }) => {
  const [value, setValue] = useState<StickerValueMap<string>>(createStickerValueMap<string>(stickers));
  const [mode, setMode] = useState<'interactive' | 'static'>('static');

  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const activeMode = editable ? mode : 'static';

  return (
    <div className="flex flex-col gap-4 w-full">
      <div ref={ref} className="w-full relative">
        <StickerStage
          stickers={stickers}
          mode={activeMode}
          style={{ width: width ?? 0, height: 400 }}
          referenceSize={{ width: 800, height: 400 }}
          peel={{ hover: 0.2, drag: 0.3 }}
          value={value}
          onChange={editable ? setValue : undefined}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="bg-accent-50 px-8 py-6 rounded-lg text-accent-900 text-6xl font-bold">{username}</h2>
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
