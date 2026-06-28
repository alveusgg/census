import { useCurrentSeason, useShiniesForSeason } from "@/services/api/seasons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FC } from "react";

import allison from "@/assets/allison.png";

export const SeasonProgressTile: FC = () => {
  const season = useSuspenseQuery(useCurrentSeason());
  const shinies = useSuspenseQuery(useShiniesForSeason());

  const totalShinies = shinies.data.length;

  const shiniesLeft =
    totalShinies -
    shinies.data.filter((s) => "identificationId" in s && s.identificationId)
      .length;

  return (
    <div className="flex items-center gap-4 py-4 md:pr-6 md:py-2 @container">
      <div
        className="w-20 md:w-24 h-20 shrink-0"
        aria-label="Mascot placeholder"
      >
        <img
          src={allison}
          alt="Allison"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <h3 className="font-serif text-xl font-bold text-accent-900 leading-tight">
          generation one
        </h3>
        <p className="text-sm font-semibold text-accent-800">
          {format(new Date(season.data.startDate), "MMM yyyy")} -{" "}
          {format(new Date(season.data.endDate), "MMM yyyy")}
        </p>
        <div className="h-2.5 w-full rounded-full bg-accent-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-leaderboard-500 transition-all duration-500"
            style={{ width: `${(totalShinies - shiniesLeft) * 100}%` }}
          />
        </div>
        <p className="text-sm font-semibold text-accent-900">
          {shiniesLeft} shinies left to unlock!
        </p>
      </div>
    </div>
  );
};
