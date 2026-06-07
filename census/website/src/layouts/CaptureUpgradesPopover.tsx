import { Img } from "@/components/assets/images/Img";
import { Button } from "@/components/controls/button/juicy";
import SiClose from "@/components/icons/SiClose";
import SiUploadCloud from "@/components/icons/SiUploadCloud";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkCaptureDead,
  useUnconvertedCaptures,
} from "@/services/api/capture";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const thumbnailSizeRegex = /-\d+x\d+(?=\.\w+$)/;
const getThumbnailUrl = (url: string) => {
  if (thumbnailSizeRegex.test(url)) {
    return url.replace(thumbnailSizeRegex, "-1920x1080");
  }

  return url.replace(/(\.\w+)$/, "-1920x1080$1");
};

const statusLabels = {
  draft: "Waiting...",
  pending: "Waiting...",
  processing: "Upgrading...",
  complete: "Ready",
  archived: "Archived",
  failed: "Failed",
  dead: "Failed",
};

const statusClasses = {
  draft: "border-alveus-darker/20 bg-alveus-darker/30 text-white",
  pending: "border-alveus-darker/20 bg-alveus-darker/30 text-white",
  processing: "border-alveus-darker/20 bg-alveus-darker/30 text-white",
  complete: "border-green-950/40 bg-green-700 text-white",
  archived: "border-alveus-darker/20 bg-alveus-darker/30 text-white",
  failed: "border-red-950/40 bg-red-700 text-white",
  dead: "border-red-950/40 bg-red-700 text-white",
};

export const CaptureUpgradesPopover = () => {
  const query = useQuery(useUnconvertedCaptures());
  const markCaptureDead = useMarkCaptureDead();
  const captures = query.data ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="alveus"
          className="overflow-visible text-xl"
          aria-label="View clip upgrades"
        >
          <SiUploadCloud />
          {captures.length > 0 && (
            <span className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-accent-50 bg-red-600" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="max-h-[80vh] w-[22rem] p-0 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-alveus-darker/30 bg-alveus text-white shadow-xl"
      >
        <div className="flex max-h-[calc(80vh-2rem)] flex-col gap-3 overflow-y-auto pr-3 p-3">
          {query.isLoading && <CaptureUpgradeSkeleton />}
          {query.isError && (
            <p className="rounded-xl border border-red-950/40 bg-red-700 px-4 py-6 text-center font-medium">
              Sorry, we couldn't load your clip upgrades.
            </p>
          )}
          {!query.isLoading && !query.isError && captures.length === 0 && (
            <p className="rounded-xl border border-white/10 bg-white/10 px-4 py-6 text-center font-medium">
              No clips waiting for your upgrades.
            </p>
          )}
          {captures.map((capture) => {
            const thumbnail = getThumbnailUrl(capture.clipMetadata.thumbnail);

            return (
              <div key={capture.id} className="relative">
                <Link
                  to={`/captures/${capture.id}`}
                  className="grid grid-cols-[8.75rem_1fr] gap-3 rounded-xl border-2 border-white/15 bg-white/15 p-2 transition hover:bg-white/20"
                >
                  <div className="aspect-video overflow-hidden rounded-lg bg-black">
                    {thumbnail && (
                      <Img
                        src={thumbnail}
                        options={{ width: 280, height: 158, fit: "cover" }}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col justify-center gap-0.5">
                    <p className="font-bold leading-none">Clip #{capture.id}</p>
                    <p className="text-sm font-medium text-white/90 leading-none">
                      {formatDistanceToNow(capture.capturedAt, {
                        addSuffix: true,
                      })}
                    </p>
                    <div
                      className={cn(
                        "rounded-md border px-3 py-1 mt-1 text-center text-sm font-bold",
                        statusClasses[capture.status],
                      )}
                    >
                      {statusLabels[capture.status]}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-alveus bg-white text-alveus-darker shadow-sm transition hover:bg-red-600 hover:text-white disabled:pointer-events-none disabled:opacity-60"
                  aria-label={`Clear clip ${capture.id}`}
                  title="Clear this upgrade"
                  disabled={markCaptureDead.isPending}
                  onClick={() => markCaptureDead.mutate(capture.id)}
                >
                  <SiClose className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CaptureUpgradeSkeleton = () => (
  <>
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="grid grid-cols-[8.75rem_1fr] gap-3 rounded-xl border-2 border-white/15 bg-white/15 p-2"
      >
        <div className="aspect-video animate-pulse rounded-lg bg-black" />
        <div className="flex flex-col justify-center gap-2">
          <div className="h-5 w-20 animate-pulse rounded bg-white/20" />
          <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
          <div className="h-8 w-full animate-pulse rounded-md bg-white/20" />
        </div>
      </div>
    ))}
  </>
);
