import { InfiniteFeedSentinel } from '@/components/feed/InfiniteFeedSentinel';
import { Loader } from '@/components/loaders/Loader';
import { useUserIdentifications } from '@/services/api/users';
import { cn } from '@/utils/cn';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FC, useMemo } from 'react';
import { IdentificationFeedCard } from '../identifications/ConfirmedObservationFeedCard';

export const ProfileIdentificationFeed: FC<{ userId: number; className?: string }> = ({ userId, className }) => {
  const query = useUserIdentifications(userId);
  const identifications = useInfiniteQuery(query);

  const pages = identifications.data?.pages ?? [];
  const allIdentifications = useMemo(() => pages.flatMap(page => page.data), [pages]);
  const grouped = useMemo(() => {
    return Object.groupBy(allIdentifications, identification =>
      format(new Date(identification.observation.observedAt), 'do MMM')
    );
  }, [allIdentifications]);

  if (!identifications.data) {
    return (
      <div className={cn('flex min-h-24 items-center justify-center pt-12', className)}>
        <Loader className="size-6 text-accent-900" />
      </div>
    );
  }

  return (
    <section className={cn('w-full', className)}>
      {allIdentifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-accent-300 bg-accent-50 px-4 py-10 text-center text-sm font-medium text-accent-800">
          No identifications yet.
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([date, group]) => (
            <div key={date}>
              <h3 className="mb-4 text-2xl font-bold text-accent-900">{date}</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
                {group?.map(identification => (
                  <IdentificationFeedCard
                    key={identification.id}
                    observedAt={identification.observation.observedAt}
                    identification={identification}
                    images={identification.observation.sightings.flatMap(sighting => sighting.images)}
                  />
                ))}
              </div>
            </div>
          ))}
          <InfiniteFeedSentinel
            className="flex min-h-10 items-center justify-center text-sm text-accent-800"
            fetchNextPage={() => identifications.fetchNextPage()}
            hasNextPage={identifications.hasNextPage}
            isFetchingNextPage={identifications.isFetchingNextPage}
            threshold={0.8}
          >
            Loading...
          </InfiniteFeedSentinel>
        </div>
      )}
    </section>
  );
};
