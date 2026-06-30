import * as Slider from '@radix-ui/react-slider';
import * as Controls from '@react-av/controls';
import * as Media from '@react-av/core';
import { ProgressBarRoot } from '@react-av/sliders';
import { FramePreviews } from './FramePreviews';
import { Playhead } from './Playhead';
import { Second } from './Ticks';

export const PlaybackBar = () => {
  const duration = Media.useMediaDuration();
  const state = Media.useMediaReadyState();

  return (
    <div className="bg-accent-300 px-4 pt-2 pb-4 rounded-lg select-none">
      <div className="flex gap-4 items-end">
        <Controls.PlayPause className="text-accent-950" />

        {state !== Media.MediaReadyState.HAVE_NOTHING && (
          <div className="flex-1 grid grid-flow-col items-center relative">
            <FramePreviews />
            <ProgressBarRoot className="absolute inset-0 z-10">
              <Slider.Track className="absolute inset-0"></Slider.Track>
              <Playhead />
            </ProgressBarRoot>

            {new Array(Math.ceil(duration)).fill(null).map((_, i) => (
              <Second key={i} second={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
