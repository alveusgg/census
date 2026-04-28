import type { View } from '@/components/pano/lib/controls';
import { getViewBounds, type ViewBoundsBox } from '@/components/pano/viewBounds';
import type { DateRange } from 'react-day-picker';

export type IdentificationFilters = {
  view: View;
  dirty: boolean;
  active: boolean;
  dateRange?: DateRange;
  type: 'all';
};

export type ConfirmedObservationFilter = {
  start?: Date;
  end?: Date;
  within?: ViewBoundsBox | ViewBoundsBox[];
};

export const getConfirmedObservationFilter = (
  filters: IdentificationFilters,
  aspectRatio: number
): ConfirmedObservationFilter => {
  const filter: ConfirmedObservationFilter = {};

  if (filters.dateRange?.from) filter.start = filters.dateRange.from;
  if (filters.dateRange?.to) filter.end = filters.dateRange.to;

  if (filters.dirty && filters.active) {
    const boxes = getViewBounds(filters.view, aspectRatio).boxes;
    filter.within = boxes.length === 1 ? boxes[0] : boxes;
  }

  return filter;
};
