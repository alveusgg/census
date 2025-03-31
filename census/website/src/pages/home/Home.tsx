import { Counter } from '@/components/animation/Counter';
import { Link } from '@/components/controls/button/juicy';
import SiChevronDown from '@/components/icons/SiChevronDown';
import { useCurrentSeason } from '@/services/api/seasons';
import { key, useAPI } from '@/services/query/hooks';
import { cn } from '@/utils/cn';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { ShiniesForSeason } from '../identifications/Shiny';
import { Badge } from './leaderboards/Badge';
import { Podium } from './leaderboards/Podium';

const useLeaderboard = (from: Date) => {
  const trpc = useAPI();
  return queryOptions({
    queryKey: key('points', 'leaderboard'),
    queryFn: async () => {
      const [leaderboard, place] = await Promise.all([
        trpc.users.leaderboard.query({ from }),
        trpc.me.place.query({ from })
      ]);
      return { leaderboard, place };
    }
  });
};

export const Home: FC = () => {
  const query = useCurrentSeason();
  const season = useSuspenseQuery(query);
  const leaderboardQuery = useLeaderboard(season.data.startDate);
  const leaderboard = useSuspenseQuery(leaderboardQuery);
  const [first, second, third] = leaderboard.data.leaderboard;

  return (
    <div className="grid grid-cols-1 @5xl:grid-cols-2 gap-8 mx-auto max-w-5xl w-full">
      <div className="col-span-1 @5xl:col-span-2 flex flex-col p-4 items-center justify-center text-center py-4 text-accent-900">
        <h1 className="text-3xl font-semibold">welcome to the</h1>
        <h2 className="text-5xl font-bold">alveus pollinator census</h2>
      </div>
      <div className="flex flex-col bg-[#B068F8] border border-[#8D40DB] px-8 pb-5 pt-7 rounded-2xl overflow-clip @container">
        <div className="flex justify-between">
          <h2 className="text-white text-2xl font-bold">Leaderboard</h2>
        </div>
        <div className="flex gap-4 items-end h-32 w-full">
          {second && (
            <Podium
              transition={{ delay: 1 }}
              badge={
                <Badge
                  className="-top-6 absolute left-1/2 -translate-x-1/2"
                  variant="silver"
                  transition={{ delay: 1.25 }}
                >
                  {places.second}
                </Badge>
              }
            >
              <p className="text-white text-base leading-tight font-bold font-sans @xl:text-xl">{second.username}</p>
              <Counter className="text-3xl" duration={1} delay={1.25}>
                {second.points}
              </Counter>
            </Podium>
          )}

          {first && (
            <Podium
              className="flex-1"
              badge={
                <Badge
                  className="-top-8 absolute left-1/2 -translate-x-1/2"
                  variant="gold"
                  transition={{ delay: 0.25 }}
                >
                  {places.first}
                </Badge>
              }
            >
              <p className="text-white text-lg leading-tight font-bold font-sans @xl:text-xl">{first.username}</p>
              <Counter className="text-4xl" duration={1} delay={0.5}>
                {first.points}
              </Counter>
            </Podium>
          )}

          {third && (
            <Podium
              transition={{ delay: 2 }}
              badge={
                <Badge
                  className="-top-6 absolute left-1/2 -translate-x-1/2"
                  variant="bronze"
                  transition={{ delay: 2.25 }}
                >
                  {places.third}
                </Badge>
              }
            >
              <p className="text-white text-base leading-tight font-bold font-sans @xl:text-xl">{third.username}</p>
              <Counter className="text-3xl" duration={1} delay={2.5}>
                {third.points}
              </Counter>
            </Podium>
          )}
        </div>
        <motion.span className="flex flex-col items-center">
          <span className="h-1 w-10 rounded-full bg-black my-3 bg-opacity-10" />
          <div className="w-full text-white text-sm bg-[#A356F0] border shadow-inner border-[#8D40DB] flex items-center gap-4 px-4 py-2 rounded-xl justify-between">
            <span className="flex items-center gap-4">
              <span className="font-bold font-mono text-lg">{leaderboard.data.place.place}</span>
              {leaderboard.data.place.me?.username ?? 'pollinatorcam'}
            </span>
            <span className="font-bold font-mono text-xl">{leaderboard.data.place.me?.points ?? 0}</span>
          </div>
        </motion.span>
        <motion.button className="text-white flex text-sm mx-auto items-center mt-3 py-1 px-3 rounded-lg transition-colors duration-300 hover:bg-white hover:bg-opacity-5 border border-transparent hover:border-white hover:border-opacity-10">
          <SiChevronDown className={cn('transition-transform duration-300 text-xl -ml-1.5')} />
          <span>show more</span>
        </motion.button>
      </div>
      <div className="text-accent-900 flex flex-col gap-3 bg-accent-50 border border-accent border-opacity-50 px-8 pb-5 pt-7 rounded-2xl overflow-clip @container">
        <h2 className="text-2xl font-bold text-accent-900">
          <span>Get started</span>
        </h2>
        <p className="">
          Welcome to the Alveus Pollinator Census! This is a community-driven project to identify and document all the
          pollinators found in the garden.
        </p>
        <p>
          Have a look around and see what's been identified already! If you'd like to contribute, you can sign up below
          by completing a quick questionnaire.
        </p>
        <Link to="/forms/onboarding" variant="alveus" className="mt-4 text-center w-full">
          Sign up to help out!
        </Link>
      </div>
      <div className="col-span-1 @5xl:col-span-2">
        <ShiniesForSeason />
      </div>
    </div>
  );
};

const places = {
  first: (
    <svg width={34} className="z-10" viewBox="0 0 92.12 125">
      <defs>
        <linearGradient id="linear-gradient" x1="46.06" y1="2.33" x2="46.06" y2="123.49" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#e6b433" />
          <stop offset=".32" stop-color="#ecc354" />
          <stop offset=".41" stop-color="#fff6c5" />
          <stop offset=".48" stop-color="#ffeb7e" />
          <stop offset=".8" stop-color="#e8b83c" />
          <stop offset="1" stop-color="#ffe96d" />
        </linearGradient>
      </defs>
      <path
        d="m18.28,125c-5.46,0-9.77-1.59-12.83-4.73-3.02-3.1-4.56-7.25-4.56-12.34s1.56-9.42,4.65-12.43c3.05-2.97,7.34-4.48,12.74-4.48h9.15v-43.47l-2.01,1.25c-3.09,1.9-6.17,2.86-9.17,2.86-.7,0-1.41-.05-2.1-.16-3.56-.54-6.6-2.09-9.03-4.6-2.29-2.35-3.85-5.25-4.65-8.59-.83-3.45-.57-6.96.76-10.43,1.38-3.6,4.05-6.53,7.92-8.71L31.35,5.45c2.61-1.73,5.42-3.08,8.34-4.01,3-.96,6.19-1.44,9.48-1.44,5.36,0,9.72,1.53,12.97,4.55,3.35,3.12,5.05,7.44,5.05,12.83v73.65h7.71c5.29,0,9.53,1.5,12.57,4.47,3.09,3.01,4.65,7.19,4.65,12.43s-1.55,9.41-4.6,12.46c-3.05,3.05-7.3,4.6-12.62,4.6H18.28Z"
        fill="#6B5C3F"
      />
      <path
        d="m18.28,120c-4.08,0-7.16-1.07-9.25-3.22-2.09-2.14-3.14-5.09-3.14-8.85s1.05-6.81,3.14-8.85c2.09-2.04,5.17-3.06,9.25-3.06h14.15V30.09h13.67l-23.32,14.48c-2.79,1.72-5.42,2.39-7.88,2.01-2.47-.37-4.53-1.42-6.19-3.14-1.66-1.71-2.79-3.8-3.38-6.27-.59-2.47-.4-4.96.56-7.48.97-2.52,2.9-4.58,5.79-6.19l22.36-13.83c2.25-1.5,4.64-2.65,7.16-3.46,2.52-.8,5.17-1.21,7.96-1.21,4.07,0,7.26,1.07,9.57,3.22,2.3,2.15,3.46,5.2,3.46,9.17v78.65h12.71c3.97,0,7,1.02,9.09,3.06,2.09,2.04,3.14,4.99,3.14,8.85s-1.05,6.84-3.14,8.93-5.12,3.14-9.09,3.14H18.28Z"
        fill="url(#linear-gradient)"
      />
    </svg>
  ),
  second: (
    <svg width={30} className="z-10" viewBox="0 0 94.1 124.99">
      <path
        d="m21.1,124.99c-6.11,0-10.75-1.63-13.81-4.84-2.99-3.14-4.5-7.56-4.5-13.15,0-3.82.85-7.33,2.53-10.41,1.49-2.73,3.53-5.46,6.06-8.11l27.91-29.19c3.96-4.16,6.75-7.69,8.29-10.5,1.36-2.48,2.03-4.84,2.03-7.21,0-3.27-1.19-4.58-2.09-5.28-1.73-1.35-4.72-2.07-8.63-2.07-2.02,0-4.3.32-6.77.96-2.53.66-5.39,1.77-8.48,3.32-2.63,1.26-5.18,1.89-7.66,1.89-1.09,0-2.18-.12-3.23-.36-3.38-.77-6.25-2.46-8.5-5.02-2.18-2.48-3.55-5.44-4.07-8.79-.53-3.38-.04-6.73,1.45-9.93,1.53-3.29,4.25-5.98,8.1-7.99,5.18-2.87,10.73-5,16.48-6.32,5.7-1.31,11.42-1.97,17-1.97,9.41,0,17.5,1.43,24.04,4.26,6.85,2.96,12.17,7.42,15.81,13.25,3.59,5.76,5.41,12.66,5.41,20.53,0,5.09-.75,10.04-2.24,14.74-1.48,4.67-3.85,9.42-7.05,14.13-3.11,4.57-7.28,9.49-12.39,14.6l-9.65,9.59h19.74c5.42,0,9.68,1.52,12.67,4.51,3,3,4.51,7.16,4.51,12.36s-1.5,9.35-4.46,12.39c-3,3.08-7.28,4.64-12.72,4.64H21.1Z"
        fill="#6B5C3F"
        stroke-width="0"
      />
      <path
        d="m21.1,119.99c-4.71,0-8.1-1.09-10.18-3.29-2.08-2.19-3.13-5.43-3.13-9.7,0-2.99.64-5.67,1.92-8.02,1.28-2.35,3.05-4.7,5.29-7.06l27.91-29.19c4.27-4.49,7.3-8.34,9.06-11.55,1.76-3.21,2.65-6.42,2.65-9.62,0-4.06-1.34-7.14-4.01-9.22-2.67-2.08-6.58-3.13-11.71-3.13-2.46,0-5.13.38-8.02,1.12-2.89.75-6.04,1.98-9.46,3.69-2.67,1.28-5.19,1.66-7.54,1.12-2.35-.53-4.3-1.68-5.85-3.45-1.55-1.76-2.51-3.85-2.89-6.25-.38-2.41-.03-4.76,1.04-7.06,1.07-2.3,3.05-4.19,5.93-5.69,4.81-2.67,9.89-4.62,15.24-5.85,5.35-1.23,10.64-1.84,15.88-1.84,8.77,0,16.12,1.28,22.05,3.85,5.93,2.57,10.45,6.33,13.55,11.31,3.1,4.97,4.65,10.93,4.65,17.88,0,4.6-.67,9.01-2,13.23-1.34,4.22-3.48,8.5-6.42,12.83-2.94,4.33-6.87,8.96-11.79,13.87l-25.82,25.66v-7.54h39.45c4.06,0,7.11,1.02,9.14,3.05,2.03,2.03,3.05,4.97,3.05,8.82s-1.02,6.82-3.05,8.9c-2.03,2.09-5.08,3.13-9.14,3.13H21.1Z"
        fill="#ECECEC"
        stroke-width="0"
      />
    </svg>
  ),
  third: (
    <svg width={30} className="z-10" viewBox="0 0 91.91 124.63">
      <path
        d="m43.51,124.63c-5.66,0-11.4-.59-17.05-1.75-5.71-1.17-10.75-2.86-14.98-5.02-4.27-1.9-7.37-4.49-9.2-7.71-1.83-3.22-2.57-6.64-2.2-10.15.36-3.39,1.58-6.44,3.62-9.07,2.18-2.81,5.14-4.66,8.8-5.5,1.15-.26,2.35-.4,3.55-.4,2.49,0,5.08.57,7.71,1.7,3.64,1.53,7,2.62,9.97,3.24,2.95.61,5.92.92,8.82.92,3.08,0,5.64-.35,7.6-1.05,1.53-.54,2.59-1.25,3.25-2.18.66-.93.97-2.09.97-3.57,0-2.87-1.13-3.65-1.61-3.98-1.14-.78-3.53-1.71-8.49-1.71h-8.49c-5.29,0-9.52-1.47-12.56-4.36-3.12-2.96-4.7-7.04-4.7-12.11s1.6-9.17,4.75-12.08c3.04-2.81,7.25-4.24,12.52-4.24h5.82c2.3,0,4.25-.31,5.81-.92,1.24-.49,2.16-1.15,2.79-2.04.59-.82.87-1.79.87-3.06,0-2.37-.9-3.36-1.77-4.02-1.6-1.2-4.42-1.83-8.16-1.83-2.35,0-4.92.3-7.65.91-2.7.6-5.63,1.66-8.72,3.16l-.19.09-.2.08c-2.27.87-4.5,1.32-6.63,1.32-1.36,0-2.7-.18-3.98-.54-3.27-.91-6.01-2.73-8.14-5.39-2.03-2.53-3.28-5.41-3.72-8.56-.45-3.27.1-6.5,1.66-9.61,1.59-3.19,4.44-5.79,8.45-7.74,4.62-2.36,9.78-4.21,15.33-5.5,5.54-1.29,11.14-1.94,16.62-1.94,9.01,0,16.85,1.37,23.32,4.08,6.74,2.83,12.03,6.97,15.71,12.31,3.72,5.39,5.6,11.87,5.6,19.27,0,5.01-.98,9.64-2.91,13.76-1.82,3.86-4.39,7.21-7.65,9.97,2.44,1.6,4.6,3.52,6.48,5.75,4.9,5.84,7.38,13.16,7.38,21.77,0,7.74-2.06,14.55-6.11,20.27-4,5.63-9.76,10.02-17.11,13.05-7.08,2.91-15.55,4.38-25.17,4.38Z"
        fill="#6B5C3F"
      />
      <path
        d="m43.51,119.63c-5.35,0-10.69-.55-16.04-1.65s-9.96-2.65-13.84-4.64c-3.36-1.47-5.69-3.35-7-5.66-1.31-2.3-1.83-4.69-1.57-7.15.26-2.46,1.13-4.64,2.59-6.53,1.47-1.89,3.46-3.12,5.98-3.7,2.52-.58,5.24-.24,8.18,1.02,3.98,1.68,7.63,2.86,10.93,3.54,3.3.68,6.58,1.02,9.83,1.02,3.67,0,6.76-.44,9.28-1.34,2.52-.89,4.4-2.23,5.66-4.01,1.26-1.78,1.89-3.93,1.89-6.45,0-3.67-1.26-6.37-3.77-8.1s-6.29-2.59-11.32-2.59h-8.49c-3.99,0-7.02-1-9.12-2.99-2.1-1.99-3.15-4.82-3.15-8.49s1.05-6.47,3.15-8.41c2.1-1.94,5.13-2.91,9.12-2.91h5.82c2.93,0,5.48-.42,7.63-1.26,2.15-.84,3.82-2.1,5.03-3.77,1.2-1.68,1.81-3.67,1.81-5.98,0-3.46-1.26-6.13-3.77-8.02-2.52-1.89-6.24-2.83-11.16-2.83-2.73,0-5.64.34-8.73,1.02-3.09.68-6.37,1.86-9.83,3.54-2.73,1.05-5.22,1.26-7.47.63-2.26-.63-4.12-1.86-5.58-3.7-1.47-1.83-2.36-3.88-2.67-6.13-.31-2.25.08-4.48,1.18-6.68,1.1-2.2,3.17-4.03,6.21-5.5,4.3-2.2,9.04-3.9,14.23-5.11,5.19-1.2,10.35-1.81,15.49-1.81,8.39,0,15.51,1.23,21.38,3.7,5.87,2.46,10.38,5.98,13.52,10.53,3.15,4.56,4.72,10.04,4.72,16.43,0,4.3-.81,8.18-2.44,11.64-1.63,3.46-3.96,6.4-7,8.81-3.04,2.41-6.66,4.14-10.85,5.19v-2.2c7.44,1.26,13.23,4.35,17.38,9.28,4.14,4.93,6.21,11.11,6.21,18.55,0,6.71-1.73,12.5-5.19,17.38-3.46,4.87-8.44,8.65-14.94,11.32-6.5,2.67-14.26,4.01-23.27,4.01Z"
        fill="#FFAB52"
      />
    </svg>
  )
};
