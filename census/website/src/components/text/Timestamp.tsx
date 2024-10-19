import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/feedback/Tooltip';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { FC } from 'react';

interface TimestampProps {
  date: Date;
}

export const Timestamp: FC<TimestampProps> = ({ date }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger type="button">
          <span>{formatInTimeZone(date, 'America/Chicago', 'PP p')}</span>
        </TooltipTrigger>
        <TooltipContent>
          <span className="flex gap-2 items-center">
            <span>Your time: {format(date, 'PP p')}</span>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
