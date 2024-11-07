import { getColorForId } from '@/services/video/utils';

import { useEditor } from '@/services/video/hooks';
import * as Media from '@react-av/core';

export const FramePreviews = () => {
  const duration = Media.useMediaDuration();
  const [, setTime] = Media.useMediaCurrentTimeFine();
  const [, setPlaying] = Media.useMediaPlaying();

  const selections = useEditor(state => state.selections);
  const frames = Object.entries(selections);

  return frames.map(([key, selection]) => {
    const time = Number(key);
    return (
      <button
        key={key}
        type="button"
        onClick={() => {
          setPlaying(false);
          setTime(time);
        }}
        className="cursor-pointer z-20 overflow-clip"
        style={{
          width: `20px`,
          borderRadius: '4px',
          left: `calc(${((time / duration) * 100).toFixed(2)}% - 10px)`,
          position: 'absolute',
          height: '20px',
          top: '1.5rem'
        }}
      >
        <span className="h-[200%] w-[200%] p-2 rotate-45 absolute -top-1/2 -left-1/2 items-center justify-stretch flex">
          {selection.map(s => (
            <span
              className="h-full flex-1"
              key={s.subjectId}
              style={{ backgroundColor: getColorForId(s.subjectId) }}
            ></span>
          ))}
        </span>
      </button>
    );
  });
};
