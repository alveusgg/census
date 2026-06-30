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
    <div className="rounded-lg bg-accent-300 px-4 pb-4 pt-2 select-none">
      <div className="flex min-w-0 items-end gap-4">
        <Controls.PlayPause className="shrink-0 text-accent-950" />

        {state !== Media.MediaReadyState.HAVE_NOTHING && (
          <div className="relative grid min-w-0 flex-1 grid-flow-col items-center [grid-auto-columns:minmax(0,1fr)]">
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
