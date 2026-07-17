import { Img } from '@/components/assets/images/Img';
import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { Preloader } from '@/components/feed/Preloader';
import SiBug2 from '@/components/icons/SiBug2';
import SiChevronLeft from '@/components/icons/SiChevronLeft';
import SiChevronRight from '@/components/icons/SiChevronRight';
import SiLeaf from '@/components/icons/SiLeaf';
import SiSearchGlobe from '@/components/icons/SiSearchGlobe';
import { Loader } from '@/components/loaders/Loader';
import { Spinner } from '@/components/loaders/Spinner';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { Timestamp } from '@/components/text/Timestamp';
import { UserLink } from '@/components/users/UserLink';
import type { RouterOutput } from '@/services/api/helpers';
import { useIdentification } from '@/services/api/identifications';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Controls, SlidePips } from '../observations/gallery/Controls';
import { Slide } from '../observations/gallery/GalleryProvider';
import { Polaroid } from '../observations/gallery/Polaroid';

export interface IdentificationProps {
  identificationId: number;
}

type User = { id: number; username: string };
type IdentificationDetail = RouterOutput['identification']['get'];
type IdentificationObservation = IdentificationDetail['observation'];
type ObservationIdentification = IdentificationObservation['identifications'][number];
type Feedback = ObservationIdentification['feedback'][number];
type ObservationImage = IdentificationObservation['sightings'][number]['images'][number];
type ConfirmationAnnotation = Feedback['annotations'][number];
type ConfirmationAnnotationItem = {
  annotation: ConfirmationAnnotation;
  image?: ObservationImage;
  id: string;
  number: number;
};

const TEXAS_TIME_ZONE = 'America/Chicago';
const DEFAULT_ANNOTATION_CANVAS_SIZE = 460;
const ANNOTATION_CROP_PADDING = 18;
const ANNOTATION_CAROUSEL_IMAGE_HEIGHT = 144;
const MIN_ANNOTATION_CAROUSEL_IMAGE_WIDTH = 96;
const MAX_ANNOTATION_CAROUSEL_IMAGE_WIDTH = 360;

const uniqueUsers = (users: User[]) => {
  return Array.from(new Map(users.map(user => [user.id, user])).values());
};

const UserLinkList: FC<{ users: User[]; limit?: number }> = ({ users, limit = 5 }) => {
  const visibleUsers = users.slice(0, limit);
  const remainingCount = users.length - visibleUsers.length;

  if (users.length === 0) return <span>unknown</span>;

  return (
    <>
      {visibleUsers.map((user, index) => (
        <span key={`${user.id}-${index}`}>
          {index > 0 && (index === visibleUsers.length - 1 && remainingCount === 0 ? ' & ' : ', ')}
          <UserLink user={user} />
        </span>
      ))}
      {remainingCount > 0 && (
        <>
          {visibleUsers.length > 0 && (visibleUsers.length === 1 ? ' and ' : ', and ')}
          <span>{remainingCount} more</span>
        </>
      )}
    </>
  );
};

const SummaryRow: FC<{ children: ReactNode; label: string }> = ({ children, label }) => {
  return (
    <div className="py-1 px-3">
      <dt className="inline text-accent-800">{label}</dt>
      <dd className="inline text-accent-900"> {children}</dd>
    </div>
  );
};

const formatTexasDate = (date: Date) => {
  return formatInTimeZone(date, TEXAS_TIME_ZONE, "MM/dd/yy 'at' h:mma").toLowerCase();
};

const getResolvedSeenAt = (observation: IdentificationObservation) => {
  const fallbackDate = new Date(observation.observedAt);
  const resolvedImageDates = observation.sightings.flatMap(sighting => {
    const captureStart = new Date(sighting.capture.startCaptureAt);
    const sightingDate = new Date(sighting.observedAt);

    return sighting.images
      .map(image => {
        const timestamp = Number(image.timestamp);
        if (Number.isFinite(captureStart.getTime()) && Number.isFinite(timestamp)) {
          return new Date(captureStart.getTime() + timestamp * 1000);
        }
        if (Number.isFinite(sightingDate.getTime())) return sightingDate;
        return undefined;
      })
      .filter((date): date is Date => Boolean(date));
  });

  return resolvedImageDates.reduce(
    (earliest, current) => (current.getTime() < earliest.getTime() ? current : earliest),
    fallbackDate
  );
};

const getSquareExtract = (
  extract: { height: number; width: number; x: number; y: number },
  image: { height: number; width: number }
) => {
  const size = Math.min(Math.max(extract.width, extract.height), image.width, image.height);
  const cx = extract.x + extract.width / 2;
  const cy = extract.y + extract.height / 2;
  const x = Math.max(0, Math.min(image.width - size, Math.round(cx - size / 2)));
  const y = Math.max(0, Math.min(image.height - size, Math.round(cy - size / 2)));

  return { height: size, width: size, x, y };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getAnnotationCrop = (image: ObservationImage, annotation: ConfirmationAnnotation) => {
  const canvas = annotation.canvas ?? {
    height: DEFAULT_ANNOTATION_CANVAS_SIZE,
    width: DEFAULT_ANNOTATION_CANVAS_SIZE
  };

  if (canvas.width <= 0 || canvas.height <= 0 || annotation.box.width <= 0 || annotation.box.height <= 0) {
    return undefined;
  }

  const mainExtract = getSquareExtract(image.boundingBox, image);
  const canvasBox = {
    height: clamp(annotation.box.height + ANNOTATION_CROP_PADDING * 2, 1, canvas.height),
    width: clamp(annotation.box.width + ANNOTATION_CROP_PADDING * 2, 1, canvas.width),
    x: clamp(annotation.box.x - ANNOTATION_CROP_PADDING, 0, canvas.width),
    y: clamp(annotation.box.y - ANNOTATION_CROP_PADDING, 0, canvas.height)
  };

  canvasBox.width = Math.min(canvasBox.width, canvas.width - canvasBox.x);
  canvasBox.height = Math.min(canvasBox.height, canvas.height - canvasBox.y);

  const scaleX = mainExtract.width / canvas.width;
  const scaleY = mainExtract.height / canvas.height;
  const sourceBox = {
    height: Math.round(canvasBox.height * scaleY),
    width: Math.round(canvasBox.width * scaleX),
    x: Math.round(mainExtract.x + canvasBox.x * scaleX),
    y: Math.round(mainExtract.y + canvasBox.y * scaleY)
  };
  const x = clamp(sourceBox.x, 0, image.width - 1);
  const y = clamp(sourceBox.y, 0, image.height - 1);

  return {
    height: clamp(sourceBox.height, 1, image.height - y),
    width: clamp(sourceBox.width, 1, image.width - x),
    x,
    y
  };
};

const getAnnotationCarouselImageWidth = (crop: { height: number; width: number }) => {
  return clamp(
    Math.round((crop.width / crop.height) * ANNOTATION_CAROUSEL_IMAGE_HEIGHT),
    MIN_ANNOTATION_CAROUSEL_IMAGE_WIDTH,
    MAX_ANNOTATION_CAROUSEL_IMAGE_WIDTH
  );
};

const IdentificationImage: FC<{ image: ObservationImage }> = ({ image }) => {
  const [hasLoadedHighResolutionImage, setHasLoadedHighResolutionImage] = useState(false);

  return (
    <div className="relative h-full w-full overflow-clip">
      {!hasLoadedHighResolutionImage && (
        <div
          role="status"
          className="absolute inset-0 z-0 flex items-center justify-center gap-2 text-base font-medium text-accent-800 sm:text-sm"
        >
          <Spinner className="h-4 w-4" />
          <span>Processing images</span>
        </div>
      )}
      <Square
        loading="lazy"
        className="absolute inset-0 z-[2] h-full w-full"
        src={image.url}
        image={{ width: image.width, height: image.height }}
        options={{ extract: image.boundingBox }}
        onLoad={() => setHasLoadedHighResolutionImage(true)}
      />
    </div>
  );
};

const TaxonLink: FC<{ identification: ObservationIdentification; tone?: 'primary' | 'plant' }> = ({
  identification,
  tone = 'primary'
}) => {
  const TaxonIcon = identification.isAccessory ? SiLeaf : SiBug2;
  const displayName = identification.nickname || identification.name;
  const scientificName = identification.name !== displayName ? identification.name : undefined;

  return (
    <div className="min-w-0">
      <a
        href={`https://www.inaturalist.org/taxa/${identification.sourceId}`}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'group flex min-w-0 items-center gap-2 text-accent-900',
          tone === 'primary' ? 'text-xl font-semibold tracking-tight sm:text-2xl' : 'text-base font-medium sm:text-lg'
        )}
      >
        <TaxonIcon className={cn('shrink-0', tone === 'plant' ? 'text-green-700' : 'text-accent-800')} />
        <span className="truncate">{displayName}</span>
        <SiSearchGlobe className="shrink-0 text-lg text-accent-700 transition-colors group-hover:text-accent-900" />
      </a>
      {scientificName && <p className="text-sm text-accent-800/80">{scientificName}</p>}
    </div>
  );
};

const AnnotationNumberBadge: FC<{ className?: string; number: number }> = ({ className, number }) => {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border-2 border-accent-800 bg-accent-50 px-1.5 text-sm font-black leading-none text-accent-900',
        className
      )}
    >
      {number}
    </span>
  );
};

const AnnotationCropImage: FC<{
  annotation: ConfirmationAnnotation;
  className?: string;
  image?: ObservationImage;
  width?: number;
}> = ({ annotation, className, image, width = 360 }) => {
  if (!image) return null;

  const crop = getAnnotationCrop(image, annotation);
  if (!crop) return null;

  return (
    <Img
      alt=""
      src={image.url}
      className={cn('h-full w-full object-cover outline-1 -outline-offset-1 outline-black/5', className)}
      options={{ extract: crop, quality: 90, width: Math.min(Math.max(crop.width, 180), width) }}
    />
  );
};

const AnnotationCarouselButton: FC<{
  direction: 'next' | 'previous';
  disabled: boolean;
  onClick: () => void;
}> = ({ direction, disabled, onClick }) => {
  const Icon = direction === 'next' ? SiChevronRight : SiChevronLeft;

  return (
    <button
      aria-label={`${direction === 'next' ? 'next' : 'previous'} annotation image`}
      className={cn(
        'absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-accent border-opacity-50 bg-white p-1 text-accent-900 shadow-xl',
        'disabled:pointer-events-none disabled:opacity-0',
        direction === 'next' ? '-right-2' : '-left-2'
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="text-2xl" />
    </button>
  );
};

const ConfirmationAnnotationImageCarousel: FC<{ items: ConfirmationAnnotationItem[] }> = ({ items }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const imageItems = items.flatMap(item => {
    if (!item.image) return [];

    const crop = getAnnotationCrop(item.image, item.annotation);
    if (!crop) return [];

    return [{ ...item, crop }];
  });

  const updateScrollButtons = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const maxScrollLeft = scrollArea.scrollWidth - scrollArea.clientWidth;
    setCanScrollPrevious(scrollArea.scrollLeft > 1);
    setCanScrollNext(scrollArea.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    updateScrollButtons();
    scrollArea.addEventListener('scroll', updateScrollButtons, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(scrollArea);

    return () => {
      scrollArea.removeEventListener('scroll', updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [imageItems.length, updateScrollButtons]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    scrollArea.scrollBy({ behavior: 'smooth', left: scrollArea.clientWidth * direction });
  }, []);

  if (imageItems.length === 0) return null;

  return (
    <div className="@container px-4 py-4 sm:px-5">
      <div className="relative">
        <div
          ref={scrollAreaRef}
          aria-label="annotation image carousel"
          className="flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {imageItems.map(item => (
            <figure
              key={item.id}
              className="relative shrink-0 snap-start"
              style={{ width: getAnnotationCarouselImageWidth(item.crop) + 12 }}
            >
              <AnnotationNumberBadge className="absolute left-0 top-0 z-10 h-7 min-w-7" number={item.number} />
              <div
                className="ml-3 mt-2 h-36 overflow-hidden rounded-sm border border-accent-300/80 bg-white p-2"
                style={{ width: getAnnotationCarouselImageWidth(item.crop) }}
              >
                <AnnotationCropImage annotation={item.annotation} image={item.image} width={640} />
              </div>
            </figure>
          ))}
        </div>
        {imageItems.length > 1 && (
          <>
            <AnnotationCarouselButton
              direction="previous"
              disabled={!canScrollPrevious}
              onClick={() => scrollByPage(-1)}
            />
            <AnnotationCarouselButton direction="next" disabled={!canScrollNext} onClick={() => scrollByPage(1)} />
          </>
        )}
      </div>
    </div>
  );
};

const ConfirmationAnnotationTextItem: FC<ConfirmationAnnotationItem> = ({ annotation, number }) => {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 px-6 py-1">
      <AnnotationNumberBadge className="h-7 w-7" number={number} />
      <div className="min-w-0 pt-0.5">
        <p className="text-pretty text-base font-medium leading-snug text-accent-900">
          {annotation.comment || 'No note provided'}
        </p>
      </div>
    </li>
  );
};

const ConfirmationAnnotationTextList: FC<{ items: ConfirmationAnnotationItem[] }> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <ol className="flex flex-col gap-2 py-3" role="list">
      {items.map(item => (
        <ConfirmationAnnotationTextItem key={item.id} {...item} />
      ))}
    </ol>
  );
};

const Identification: FC<IdentificationProps> = ({ identificationId }) => {
  const query = useIdentification(identificationId);
  const identification = useSuspenseQuery(query);

  if (!identification.data?.observation) throw new Error('Observation not found');

  const observation = identification.data.observation;
  const selectedIdentification = observation.identifications.find(item => item.id === identification.data.id);
  if (!selectedIdentification) throw new Error('Identification not found on observation');

  const images = observation.sightings.flatMap(sighting => sighting.images);
  const feedback = selectedIdentification.feedback;
  const confirmationFeedback = feedback.filter(item => item.type === 'confirm');
  const confirmationAnnotations = confirmationFeedback.flatMap(item =>
    item.annotations.map((annotation, index) => ({
      annotation,
      key: `${item.id}-${annotation.imageId}-${index}`
    }))
  );
  const confirmationAnnotationItems = confirmationAnnotations.map(({ annotation, key }, index) => ({
    annotation,
    image: images.find(item => item.id.toString() === annotation.imageId) ?? images[annotation.imageIndex],
    id: key,
    number: index + 1
  }));
  const confirmationComments = confirmationFeedback.filter(item => item.comment?.trim());
  const capturedBy = uniqueUsers(observation.sightings.map(sighting => sighting.observer));
  const secondedBy = uniqueUsers(feedback.filter(item => item.type === 'agree').map(item => item.submitter));
  const seenAt = getResolvedSeenAt(observation);
  const confirmedPlant = observation.identifications.find(
    item => item.isAccessory && item.confirmedBy && item.id !== selectedIdentification.id
  );

  return (
    <div className="@container w-full">
      <div className="flex min-h-0 flex-col gap-4 @lg:flex-row @lg:items-start">
        <div className="flex min-h-0 w-full min-w-0 flex-col gap-3 @lg:w-96 @lg:shrink-0">
          <Polaroid className="mx-auto p-3 sm:p-4 w-96">
            <Preloader>
              {images.map(image => (
                <Square
                  key={image.id}
                  src={image.url}
                  image={{ width: image.width, height: image.height }}
                  options={{ extract: image.boundingBox }}
                />
              ))}
            </Preloader>

            {images.map(image => (
              <Slide key={image.id} id={image.id.toString()}>
                <IdentificationImage image={image} />
              </Slide>
            ))}
            <Controls />
            <SlidePips />
          </Polaroid>

          <Note className="min-w-0 text-accent-900">
            <div className="pt-3 text-lg font-bold">
              <SummaryRow label="Captured">
                by <UserLinkList users={capturedBy} />
              </SummaryRow>
            </div>
            <SummaryRow label="Suggested">
              by <UserLink user={selectedIdentification.suggester} className="font-semibold" />
            </SummaryRow>
            {secondedBy.length > 0 && (
              <SummaryRow label="Seconded">
                by <UserLinkList users={secondedBy} />
              </SummaryRow>
            )}
            <SummaryRow label="Seen">
              at{' '}
              <Timestamp date={seenAt}>
                <span className="font-semibold tabular-nums">{formatTexasDate(seenAt)}</span>
              </Timestamp>
            </SummaryRow>
          </Note>
        </div>

        <Note className="w-full @container @lg:flex-1">
          <div className="flex flex-col gap-1 px-4 py-3">
            <TaxonLink identification={selectedIdentification} />
            {confirmedPlant && <TaxonLink identification={confirmedPlant} tone="plant" />}
          </div>

          <div className="min-h-0 py-2">
            {confirmationAnnotationItems.length > 0 && (
              <>
                <ConfirmationAnnotationImageCarousel items={confirmationAnnotationItems} />
                <ConfirmationAnnotationTextList items={confirmationAnnotationItems} />
              </>
            )}
          </div>

          {confirmationFeedback.length > 0 && (
            <div className="px-4 py-3">
              {confirmationComments.length > 0 ? (
                confirmationComments.map(item => (
                  <figure key={item.id} className="flex flex-col gap-2">
                    <blockquote>
                      <p className="max-w-[46ch] text-pretty text-base font-medium text-accent-900">{item.comment}</p>
                    </blockquote>
                    <figcaption className="text-sm italic text-accent-800">
                      - confirmed by <UserLink user={item.submitter} className="font-semibold" />
                    </figcaption>
                  </figure>
                ))
              ) : (
                <p className="text-sm italic text-accent-800">
                  - confirmed by{' '}
                  {confirmationFeedback.map((item, index) => (
                    <span key={item.id}>
                      {index > 0 && ', '}
                      <UserLink user={item.submitter} className="font-semibold" />
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </Note>
      </div>
    </div>
  );
};

export const IdentificationModal: FC<ModalProps<IdentificationProps>> = props => {
  return (
    <Modal
      {...props}
      title="Identification details"
      className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl overflow-y-auto rounded-lg bg-accent-100 p-3 text-accent-900 ring-4 ring-inset ring-accent-300 sm:p-4"
    >
      <Suspense fallback={<Loader className="m-24 mx-auto h-6 w-6 text-accent-900" />}>
        {props.props?.identificationId && <Identification identificationId={props.props.identificationId} />}
      </Suspense>
    </Modal>
  );
};

export const IdentificationPage: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goToAllIdentifications = () => navigate('/identifications');

  return (
    <IdentificationModal
      props={{ identificationId: Number(id) }}
      isOpen={true}
      open={goToAllIdentifications}
      close={goToAllIdentifications}
      toggle={goToAllIdentifications}
    />
  );
};
