import { Square } from '@/components/assets/images/Square';
import SiChevronLeft from '@/components/icons/SiChevronLeft';
import SiChevronRight from '@/components/icons/SiChevronRight';
import SiClose from '@/components/icons/SiClose';
import { Modal } from '@/components/modal/Modal';
import type { Observation } from '@/services/api/observations';
import { type FC, type KeyboardEvent } from 'react';

type ObservationImage = Observation['sightings'][number]['images'][number];

interface ObservationImageGalleryProps {
  images: ObservationImage[];
  observationId: number;
  selectedIndex: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export const ObservationImageGallery: FC<ObservationImageGalleryProps> = ({
  images,
  observationId,
  selectedIndex,
  onClose,
  onSelect
}) => {
  const isOpen = selectedIndex !== null && images.length > 0;
  const currentIndex = Math.min(selectedIndex ?? 0, Math.max(images.length - 1, 0));
  const currentImage = images[currentIndex];

  const selectRelativeImage = (offset: number) => {
    onSelect((currentIndex + offset + images.length) % images.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectRelativeImage(-1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectRelativeImage(1);
    }
  };

  return (
    <Modal
      title={`Observation #${observationId} image gallery`}
      isOpen={isOpen}
      open={() => undefined}
      close={onClose}
      toggle={onClose}
      onKeyDown={handleKeyDown}
      className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 bg-black p-0 text-white sm:rounded-none"
    >
      {currentImage && (
        <>
          <div className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 sm:px-6">
            <p className="text-sm font-medium tabular-nums" aria-live="polite">
              Image {currentIndex + 1} of {images.length}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close image gallery"
              className="flex size-10 items-center justify-center rounded-full bg-black/40 text-2xl transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <SiClose />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-16 sm:px-20">
            <div className="size-[min(calc(100dvh-8rem),calc(100vw-2rem))] overflow-hidden sm:size-[min(calc(100dvh-8rem),calc(100vw-10rem))]">
              <Square
                src={currentImage.url}
                image={{ width: currentImage.width, height: currentImage.height }}
                options={{ extract: currentImage.boundingBox }}
                alt={`Observation #${observationId} image ${currentIndex + 1}`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => selectRelativeImage(-1)}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-4xl shadow-lg transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5 sm:size-12"
              >
                <SiChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => selectRelativeImage(1)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-4xl shadow-lg transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:size-12"
              >
                <SiChevronRight />
              </button>
            </>
          )}
        </>
      )}
    </Modal>
  );
};
