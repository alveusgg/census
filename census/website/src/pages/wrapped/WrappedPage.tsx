import { FC } from 'react';
import { SeasonWrapped } from './SeasonWrapped';

/** Standalone page for the season-in-review, viewable without signing in. */
export const WrappedPage: FC = () => (
  <main className="flex min-h-dvh items-center justify-center bg-accent-50 p-4 sm:p-8">
    <div className="grid w-full max-w-6xl grid-cols-8">
      <SeasonWrapped />
    </div>
  </main>
);
