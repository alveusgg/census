import { Button as PaperButton } from '@/components/controls/button/paper';
import { InfiniteFeedSentinel } from '@/components/feed/InfiniteFeedSentinel';
import { Loader } from '@/components/loaders/Loader';
import { DEFAULT_VIEW, type View } from '@/components/pano/Pano';
import { PanoViewInput } from '@/components/pano/PanoViewInput';
import { SelectionActionBar, SelectionCount } from '@/components/selection/SelectionActionBar';
import { useSelection } from '@/components/selection/SelectionProvider';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmedObservations } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Outlet } from 'react-router';
import { getConfirmedObservationFilter, type IdentificationFilters } from './filters';
import { ConfirmedObservationFeedCard } from './ConfirmedObservationFeedCard';

const TODAY = startOfDay(new Date());
const DEFAULT_DATE_RANGE: DateRange = {
  from: subDays(TODAY, 6),
  to: endOfDay(TODAY)
};

const getDateRangeLabel = (dateRange?: DateRange) => {
  if (!dateRange?.from) return 'Last 7 days';
  if (!dateRange.to) return format(dateRange.from, 'MMM d, yyyy');
  return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
};

const ConfirmedObservationsFeed = ({ filter }: { filter: ReturnType<typeof getConfirmedObservationFilter> }) => {
  const query = useConfirmedObservations(filter);
  const observations = useSuspenseInfiniteQuery(query);

  const allObservations = useMemo(() => observations.data.pages.flatMap(page => page.data), [observations.data.pages]);

  const grouped = useMemo(() => {
    return Object.groupBy(allObservations, observation => format(new Date(observation.observedAt), 'do MMM'));
  }, [allObservations]);

  return (
    <div className="pt-12 space-y-12">
      {Object.entries(grouped).map(([date, group]) => (
        <div key={date}>
          <h2 className="text-2xl font-bold text-accent-900 mb-4">{date}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
            {group?.map(observation => (
              <ConfirmedObservationFeedCard key={observation.id} observation={observation} />
            ))}
          </div>
        </div>
      ))}
      <InfiniteFeedSentinel
        className="flex min-h-10 items-center justify-center text-sm text-accent-800"
        fetchNextPage={() => observations.fetchNextPage()}
        hasNextPage={observations.hasNextPage}
        isFetchingNextPage={observations.isFetchingNextPage}
        threshold={0.8}
      >
        Loading...
      </InfiniteFeedSentinel>
    </div>
  );
};

export const Identifications = () => {
  const [filters, setFilters] = useState<IdentificationFilters>({
    view: DEFAULT_VIEW,
    dirty: false,
    active: false,
    dateRange: DEFAULT_DATE_RANGE,
    type: 'all'
  });
  const confirmedObservationFilter = getConfirmedObservationFilter(filters, 3 / 1);

  const { clearSelection } = useSelection();
  const viewFilterLabel = !filters.dirty
    ? 'Drag around to search by view'
    : filters.active
      ? 'Filtered by current view x'
      : 'Filter by current view';

  const handleViewChange = (view: View) => {
    setFilters(current => ({
      ...current,
      view,
      dirty: true,
      active: current.dirty ? current.active : true
    }));
  };

  return (
    <>
      <Outlet />
      <div className="w-full @container mx-auto max-w-6xl">
        <div className="pt-8">
          <PanoViewInput
            value={filters.view}
            onPointerUp={handleViewChange}
            active={filters.dirty && filters.active}
            className="w-full h-full aspect-[3/1]"
          />
          <div className="mt-4 flex items-center justify-end gap-2">
            <PaperButton
              compact
              disabled={!filters.dirty}
              onClick={() =>
                setFilters(current => ({
                  ...current,
                  active: !current.active
                }))
              }
              className={cn(
                'justify-center px-3 py-1.5',
                filters.dirty && filters.active && '!bg-[#8B4217] !bg-opacity-100 !text-white hover:!bg-[#743512]'
              )}
            >
              {viewFilterLabel}
            </PaperButton>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-accent-700/10 bg-accent-700/5 text-accent-900 hover:bg-accent-700/10"
                >
                  <CalendarIcon className="size-4" />
                  {getDateRangeLabel(filters.dateRange)}
                  <ChevronDown className="size-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={filters.dateRange}
                  onSelect={dateRange => setFilters(current => ({ ...current, dateRange }))}
                />
              </PopoverContent>
            </Popover>
            <Select
              value={filters.type}
              onValueChange={type =>
                setFilters(current => ({
                  ...current,
                  type: type as IdentificationFilters['type']
                }))
              }
            >
              <SelectTrigger className="w-24 border-accent-700/10 bg-accent-700/5 text-accent-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="flex min-h-24 items-center justify-center pt-12">
              <Loader className="size-6 text-accent-900" />
            </div>
          }
        >
          <ConfirmedObservationsFeed filter={confirmedObservationFilter} />
        </Suspense>
      </div>
      <SelectionActionBar className="justify-between">
        <SelectionCount singular="identification" />
        <div className="flex gap-2">
          <PaperButton compact onClick={clearSelection}>
            clear
          </PaperButton>
        </div>
      </SelectionActionBar>
    </>
  );
};
