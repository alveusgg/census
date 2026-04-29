import { useUnconfirmedObservationCount } from "@/services/api/observations";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { FC } from "react";
import { Link } from "react-router-dom";

export const IdentifyCrittersTile: FC = () => {
  const unconfirmedQuery = useQuery(useUnconfirmedObservationCount());
  const unconfirmedCount = unconfirmedQuery.data ?? 0;

  return (
    <div className="flex items-center gap-4 py-4 md:px-6 md:py-2 @container">
      <div
        className="w-20 md:w-16 h-16 shrink-0 rounded-lg bg-accent-100"
        aria-label="Focus target placeholder"
      />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h3 className="font-serif text-xl font-bold text-accent-900 leading-tight">
          help identify critters!
        </h3>
        <Link
          to="/observations"
          className="group inline text-sm text-accent-800 hover:text-accent-700 transition-colors leading-snug"
        >
          There are currently{" "}
          <span className="font-bold text-accent-900">{unconfirmedCount}</span> critters that
          need to be identified – you can help out!{" "}
          <ChevronRight className="size-4 inline-block align-text-bottom transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
