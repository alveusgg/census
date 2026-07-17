import { Button, Link } from '@/components/controls/button/paper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/forms/base/dropdown-menu';
import SiTrash from '@/components/icons/SiTrash';
import SiTwitch from '@/components/icons/SiTwitch';
import SiVideo from '@/components/icons/SiVideo';
import { useModal } from '@/components/modal/useModal';
import { Timestamp } from '@/components/text/Timestamp';
import { UserLink } from '@/components/users/UserLink';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { formatInTimeZone } from 'date-fns-tz';
import { type FC, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { DeleteObservationModal, type DeleteObservationModalProps } from './DeleteObservationModal';
import { useCurrentObservation } from './ObservationContext';
import { ObservationVideoModal, type ObservationVideoModalProps } from './ObservationVideoModal';
import { getObservationVideoClips } from './videoClips';

const USER_LINK_LIST_LIMIT = 3;

const getObservationFeedDate = (observation: ReturnType<typeof useCurrentObservation>) => {
  const firstSightingCaptureStart = observation.sightings.reduce<Date | undefined>((earliest, sighting) => {
    const captureStart = new Date(sighting.capture.startCaptureAt);
    if (Number.isNaN(captureStart.getTime())) return earliest;
    if (!earliest) return captureStart;
    return captureStart.getTime() < earliest.getTime() ? captureStart : earliest;
  }, undefined);

  return firstSightingCaptureStart ?? new Date(observation.observedAt);
};

const UserLinkList: FC<{ users: { id: number; username: string }[] }> = ({ users }) => {
  const uniqueUsers = Array.from(new Map(users.map(user => [user.username, user])).values());
  const visibleUsers = uniqueUsers.slice(0, USER_LINK_LIST_LIMIT);
  const remainingCount = uniqueUsers.length - visibleUsers.length;

  return (
    <>
      {visibleUsers.map((user, index) => (
        <span key={user.username}>
          {index > 0 && ', '}
          <UserLink user={user} />
        </span>
      ))}
      {remainingCount > 0 && (
        <>
          {visibleUsers.length > 0 && ' and '}
          <span>{remainingCount} more</span>
        </>
      )}
    </>
  );
};

const ObservationTimestamp: FC<{ className?: string }> = ({ className }) => {
  const observation = useCurrentObservation();
  const observationFeedDate = getObservationFeedDate(observation);

  return (
    <span className={className}>
      <Timestamp date={observationFeedDate}>
        {formatInTimeZone(observationFeedDate, 'America/Chicago', 'MM/dd/yyyy hh:mma')}
      </Timestamp>
    </span>
  );
};

const ObservationAttribution: FC<{ className?: string; timestamp: ReactNode }> = ({ className, timestamp }) => {
  const observation = useCurrentObservation();

  return (
    <div className={cn('font-mono', className)}>
      <p className="text-sm">{timestamp}</p>
      <p className="text-sm">observed by</p>
      <p className="text-lg font-semibold">
        <UserLinkList users={observation.sightings.flatMap(sighting => sighting.observer)} />
      </p>
    </div>
  );
};

const ObservationActions: FC<{ className?: string }> = ({ className }) => {
  const observation = useCurrentObservation();
  const canModerate = useHasPermission('moderate');
  const deleteObservationModal = useModal<DeleteObservationModalProps>();
  const videoModal = useModal<ObservationVideoModalProps>();
  const muxPlaybackIds = getObservationVideoClips(observation.sightings).map(clip => clip.playbackId);
  const clipIds = [
    ...new Set(
      observation.sightings
        .map(sighting => sighting.capture.clipId)
        .filter((clipId): clipId is string => Boolean(clipId))
    )
  ];

  return (
    <div className={cn('flex shrink-0 self-end gap-2 @md:self-auto', className)}>
      <DeleteObservationModal {...deleteObservationModal} />
      {canModerate && <ObservationVideoModal {...videoModal} />}
      {clipIds.length === 1 && (
        <Link
          target="_blank"
          rel="noreferrer"
          to={`https://clips.twitch.tv/${clipIds[0]}`}
          variant={false}
          aria-label="view Twitch clip"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-700/10 p-1 text-purple-800 hover:bg-purple-700/20"
        >
          <SiTwitch className="text-2xl" />
        </Link>
      )}
      {clipIds.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="view Twitch clips"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-700/10 p-1 text-purple-800 hover:bg-purple-700/20"
          >
            <SiTwitch className="text-2xl" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {clipIds.map((clipId, index) => (
              <DropdownMenuItem key={clipId} asChild>
                <a href={`https://clips.twitch.tv/${clipId}`} target="_blank" rel="noreferrer">
                  <SiTwitch className="text-lg" />
                  Clip #{index + 1}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canModerate && muxPlaybackIds.length > 0 && (
        <Button
          variant={false}
          aria-label="view stored video fullscreen"
          onClick={() =>
            videoModal.open({
              observationId: observation.id,
              playbackIds: muxPlaybackIds
            })
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 p-1 text-accent-800 hover:bg-accent-200"
        >
          <SiVideo className="text-2xl" />
        </Button>
      )}
      {canModerate && (
        <Button
          variant={false}
          aria-label="delete observation"
          onClick={() => deleteObservationModal.open({ observationId: observation.id })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 p-1 text-red-800 hover:bg-red-200"
        >
          <SiTrash className="text-2xl" />
        </Button>
      )}
    </div>
  );
};

export const ObservationCardHeader: FC<{ className?: string }> = ({ className }) => {
  const observation = useCurrentObservation();

  return (
    <header className={cn('flex flex-col gap-3 @md:flex-row @md:justify-between', className)}>
      <ObservationAttribution
        timestamp={
          <RouterLink
            target="_blank"
            rel="noreferrer"
            to={`/observations/${observation.id}`}
            aria-label={`Open observation #${observation.id}`}
            className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <ObservationTimestamp />
          </RouterLink>
        }
      />
      <ObservationActions />
    </header>
  );
};

export const ObservationPageHeader: FC<{ className?: string }> = ({ className }) => {
  return (
    <header className={cn('flex flex-col gap-3 @md:flex-row @md:justify-between', className)}>
      <ObservationAttribution timestamp={<ObservationTimestamp />} />
      <ObservationActions />
    </header>
  );
};
