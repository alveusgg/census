import { useCurrentSeason, useShiniesForSeason } from "@/services/api/seasons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FC } from "react";

export const SeasonProgressTile: FC = () => {
  const seasonQuery = useQuery(useCurrentSeason());
  const shiniesQuery = useQuery(useShiniesForSeason());

  const season = seasonQuery.data;
  const shinies = shiniesQuery.data;

  const seasonRange = season
    ? `${format(new Date(season.startDate), "MMM yyyy")} - ${format(new Date(season.endDate), "MMM yyyy")}`
    : "";

  const now = new Date();
  const seasonProgress = season
    ? Math.max(
        0,
        Math.min(
          1,
          (now.getTime() - new Date(season.startDate).getTime()) /
            (new Date(season.endDate).getTime() - new Date(season.startDate).getTime()),
        ),
      )
    : 0;

  const shiniesLeft = shinies
    ? shinies.length - shinies.filter((s) => "identificationId" in s && s.identificationId).length
    : 0;

  return (
    <div className="flex items-center gap-4 py-4 md:pr-6 md:py-2 @container">
      <div
        className="w-20 md:w-24 h-20 shrink-0 rounded-lg bg-accent-100"
        aria-label="Mascot placeholder"
      />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <h3 className="font-serif text-xl font-bold text-accent-900 leading-tight">
          generation one
        </h3>
        <p className="text-sm font-semibold text-accent-800">{seasonRange}</p>
        <div className="h-2.5 w-full rounded-full bg-accent-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-leaderboard-500 transition-all duration-500"
            style={{ width: `${seasonProgress * 100}%` }}
          />
        </div>
        <p className="text-sm font-semibold text-accent-900">
          {shiniesLeft} shinies left to unlock!
        </p>
      </div>
    </div>
  );
};
