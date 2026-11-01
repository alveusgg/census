import { Section, Step } from '@/components/wrapped';
import { FC } from 'react';
import { season } from './data';
import { CountUp, FramedImg, Slide, Stat, Ticker } from './primitives';

export const CommentsSection: FC = () => (
  <Section wait={3000}>
    <Step>
      <Slide>
        <Stat
          value={<CountUp value={season.comments} />}
          caption="comments explaining what people could see"
          className="shrink-0 wide:w-[21rem]"
        />
        <Ticker
          items={season.selections.comments}
          interval={3200}
          className="h-[17rem] wide:h-80 wide:flex-1"
          render={comment => (
            <figure className="rounded-xl border border-accent border-opacity-50 bg-white/70 px-4 py-3 shadow-sm">
              <blockquote className="line-clamp-3 text-sm font-semibold leading-snug text-accent-900 wide:text-base">
                “{comment.comment}”
              </blockquote>
              <figcaption className="mt-1.5 text-xs text-accent-700 wide:text-sm">
                <span className="font-bold">{comment.username}</span> on {comment.nickname}
              </figcaption>
            </figure>
          )}
        />
      </Slide>
    </Step>
  </Section>
);

export const SuggestionsSection: FC = () => (
  <Section wait={3000}>
    <Step>
      <Slide>
        <Stat
          value={<CountUp value={season.suggestions} />}
          caption="identifications suggested by the community"
          className="shrink-0 wide:w-[21rem]"
        />
        <Ticker
          items={season.selections.suggestions}
          visible={4}
          interval={2200}
          className="h-[17rem] wide:h-80 wide:flex-1"
          render={suggestion => (
            <div className="flex items-center gap-3 rounded-xl border border-accent border-opacity-50 bg-white/70 p-2 pr-4 shadow-sm">
              <FramedImg
                image={suggestion}
                size={128}
                alt={suggestion.nickname}
                className="size-12 shrink-0 rounded-lg bg-accent-100 object-cover wide:size-14"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight text-accent-900 wide:text-lg">
                  {suggestion.nickname}
                </p>
                <p className="truncate text-xs text-accent-700 wide:text-sm">
                  suggested by <span className="font-bold">{suggestion.username}</span>
                </p>
              </div>
            </div>
          )}
        />
      </Slide>
    </Step>
  </Section>
);
