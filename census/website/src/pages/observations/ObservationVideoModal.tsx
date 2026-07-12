import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import MuxPlayer from '@mux/mux-player-react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DialogClose, DialogTitle } from '@radix-ui/react-dialog';
import { FC, useState } from 'react';

export interface ObservationVideoModalProps {
  observationId: number;
  playbackIds: string[];
}

const ObservationVideoPlayer: FC<ObservationVideoModalProps> = ({ observationId, playbackIds }) => {
  const [playbackId, setPlaybackId] = useState(playbackIds[0]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="flex min-h-14 shrink-0 items-center gap-4 border-b border-white/15 px-4 pr-14 text-white sm:px-6">
        <h2 className="font-semibold">Observation #{observationId} video</h2>
        {playbackIds.length > 1 && (
          <div className="ml-auto mr-8 flex gap-1" aria-label="Capture video">
            {playbackIds.map((id, index) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === playbackId}
                onClick={() => setPlaybackId(id)}
                className="rounded px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white aria-pressed:bg-white/20 aria-pressed:text-white"
              >
                Video {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MuxPlayer
          key={playbackId}
          playbackId={playbackId}
          metadata={{ video_id: `observation-${observationId}`, video_title: `Observation #${observationId}` }}
          className="h-full w-full"
        />
      </div>
    </div>
  );
};

export const ObservationVideoModal: FC<ModalProps<ObservationVideoModalProps>> = props => {
  if (!props.isOpen || !props.props) return null;

  return (
    <Modal
      className="!left-0 !top-0 !h-dvh !w-screen !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-none !p-0"
      {...props}
    >
      <DialogTitle className="sr-only">Observation #{props.props.observationId} video</DialogTitle>
      <ObservationVideoPlayer {...props.props} />
      <DialogClose className="absolute right-4 top-3.5 z-10 rounded p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <Cross2Icon className="h-5 w-5" />
        <span className="sr-only">Close video</span>
      </DialogClose>
    </Modal>
  );
};
