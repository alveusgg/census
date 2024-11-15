import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/feedback/Tooltip';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, PropsWithChildren } from 'react';

interface TimestampProps {
  date: Date;
}

export const Timestamp: FC<PropsWithChildren<TimestampProps>> = ({ children, date }) => {
  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger type="button">{children}</TooltipTrigger>
        <TooltipContent>
          <span className="flex gap-2 items-center">
            <span>
              {currentTimezone}: {formatInTimeZone(date, currentTimezone, 'dd/MM/yyyy HH:mm')}
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
