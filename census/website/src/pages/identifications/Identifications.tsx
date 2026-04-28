import { Button as PaperButton } from "@/components/controls/button/paper";
import { DEFAULT_VIEW, type View } from "@/components/pano/Pano";
import { PanoViewInput } from "@/components/pano/PanoViewInput";
import { SelectionActionBar, SelectionCount } from "@/components/selection/SelectionActionBar";
import { useSelection } from "@/components/selection/SelectionProvider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirmedObservations } from "@/services/api/observations";
import { cn } from "@/utils/cn";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Outlet } from "react-router";
import { getConfirmedObservationFilter, type IdentificationFilters } from "./filters";

const TODAY = startOfDay(new Date());
const DEFAULT_DATE_RANGE: DateRange = {
  from: subDays(TODAY, 6),
  to: endOfDay(TODAY),
};

const getDateRangeLabel = (dateRange?: DateRange) => {
  if (!dateRange?.from) return "Last 7 days";
  if (!dateRange.to) return format(dateRange.from, "MMM d, yyyy");
  return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
};

export const Identifications = () => {
  const [filters, setFilters] = useState<IdentificationFilters>({
    view: DEFAULT_VIEW,
    dirty: false,
    active: false,
    dateRange: DEFAULT_DATE_RANGE,
    type: "all",
  });
  const query = useConfirmedObservations(getConfirmedObservationFilter(filters, 3 / 1));
  const observations = useSuspenseInfiniteQuery(query);

  const { clearSelection } = useSelection();
  const viewFilterLabel = !filters.dirty
    ? "Drag around to search by view"
    : filters.active
      ? "Filtered by current view x"
      : "Filter by current view";

  const handleViewChange = (view: View) => {
    setFilters((current) => ({
      ...current,
      view,
      dirty: true,
      active: current.dirty ? current.active : true,
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
                setFilters((current) => ({
                  ...current,
                  active: !current.active,
                }))
              }
              className={cn(
                "justify-center px-3 py-1.5",
                filters.dirty &&
                  filters.active &&
                  "!bg-[#8B4217] !bg-opacity-100 !text-white hover:!bg-[#743512]",
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
                  onSelect={(dateRange) => setFilters((current) => ({ ...current, dateRange }))}
                />
              </PopoverContent>
            </Popover>
            <Select
              value={filters.type}
              onValueChange={(type) =>
                setFilters((current) => ({
                  ...current,
                  type: type as IdentificationFilters["type"],
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
        <div className="grid grid-cols-5 gap-8 pt-12">
          {observations.data.pages
            .flatMap((page) => page.data)
            .map((observation) => (
              <p>{observation.id}</p>
            ))}
        </div>
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
