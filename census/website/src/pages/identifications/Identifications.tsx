import { Button as PaperButton } from '@/components/controls/button/paper';
import { InfiniteFeedSentinel } from '@/components/feed/InfiniteFeedSentinel';
import { Loader } from '@/components/loaders/Loader';
import { DEFAULT_VIEW, type View } from '@/components/pano/Pano';
import { PanoViewInput } from '@/components/pano/PanoViewInput';
import { SelectionActionBar, SelectionCount } from '@/components/selection/SelectionActionBar';
import { useSelection } from '@/components/selection/SelectionProvider';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useConfirmedObservations } from '@/services/api/observations';
import { useCurrentSeason } from '@/services/api/seasons';
import { cn } from '@/utils/cn';
import { useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Outlet } from 'react-router';
import { getConfirmedObservationFilter, type IdentificationFilters } from './filters';
import { ConfirmedObservationFeedCard } from './ConfirmedObservationFeedCard';

const getLastDaysRange = (days: number): DateRange => {
  const today = startOfDay(new Date());
  return {
    from: subDays(today, days - 1),
    to: endOfDay(today)
  };
};

const getDateRangeLabel = (dateRange?: DateRange) => {
  if (!dateRange?.from) return 'All';
  if (!dateRange.to) return format(dateRange.from, 'MMM d, yyyy');
  return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
};

const isSameRange = (range?: DateRange, target?: DateRange) => {
  if (!range?.from || !target?.from) return !range?.from && !target?.from;
  return range.from.getTime() === target.from.getTime() && range.to?.getTime() === target.to?.getTime();
};

const ConfirmedObservationsFeed = ({ filter }: { filter: ReturnType<typeof getConfirmedObservationFilter> }) => {
  const query = useConfirmedObservations(filter);
  const observations = useInfiniteQuery(query);

  const pages = observations.data?.pages ?? [];
  const allObservations = useMemo(() => pages.flatMap(page => page.data), [pages]);
  const grouped = useMemo(() => {
    return Object.groupBy(allObservations, observation => format(new Date(observation.observedAt), 'do MMM'));
  }, [allObservations]);

  if (!observations.data) {
    return (
      <div className="flex min-h-24 items-center justify-center pt-12">
        <Loader className="size-6 text-accent-900" />
      </div>
    );
  }

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
  const season = useSuspenseQuery(useCurrentSeason());
  const isMobile = useIsMobile();
  const seasonDateRange: DateRange = useMemo(
    () => ({
      from: startOfDay(new Date(season.data.startDate)),
      to: endOfDay(new Date(season.data.endDate))
    }),
    [season.data.endDate, season.data.startDate]
  );
  const [filters, setFilters] = useState<IdentificationFilters>(() => ({
    view: DEFAULT_VIEW,
    dirty: false,
    active: false,
    dateRange: seasonDateRange,
    type: 'all'
  }));
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

  const setDateRange = (dateRange?: DateRange) => {
    setFilters(current => ({ ...current, dateRange }));
  };

  const dateRangePresets = [
    { label: '7 days', range: getLastDaysRange(7) },
    { label: '30 days', range: getLastDaysRange(30) },
    { label: 'Season', range: seasonDateRange },
    { label: 'All', range: undefined }
  ];

  return (
    <>
      <Outlet />
      <Breadcrumbs>
        <p>home</p>
        <span>•</span>
        <p className="text-lg">identifications</p>
      </Breadcrumbs>
      <div className="w-full @container mx-auto max-w-6xl">
        <div className="pt-8">
          {!isMobile && (
            <PanoViewInput
              value={filters.view}
              onPointerUp={handleViewChange}
              active={filters.dirty && filters.active}
              className="w-full h-full aspect-[3/1]"
            />
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            {!isMobile && (
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
            )}
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
              <PopoverContent align="end" className="w-[15.5rem] max-w-[calc(100vw-2rem)] overflow-hidden p-0">
                <div className="grid grid-cols-2 gap-1 border-b border-accent-200 bg-accent-50/50 p-2">
                  {dateRangePresets.map(preset => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(preset.range)}
                      className={cn(
                        'text-accent-900 hover:bg-accent-200/60',
                        isSameRange(filters.dateRange, preset.range) && 'bg-accent-700 text-white hover:bg-accent-700'
                      )}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Calendar
                  mode="range"
                  selected={filters.dateRange}
                  onSelect={setDateRange}
                  showOutsideDays={false}
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
        <ConfirmedObservationsFeed filter={confirmedObservationFilter} />
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
