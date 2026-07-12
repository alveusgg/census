import { useVariable } from '@alveusgg/backstage';
import type { AppRouter } from '@alveusgg/census-api';
import { levels } from '@alveusgg/census-levels';
import { createTRPCClient, httpSubscriptionLink } from '@trpc/client';
import { motion, useAnimate } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import SuperJSON from 'superjson';

import butterfly from '@/assets/adult_butterfly.outlined.png';
import { loadLevelArtwork } from '@/lib/levels';
import { Variables } from '@/services/backstage/config';

const PATH = 'M2.6,112.4c4.78-10.18,6.54-21.75,4.99-32.89-1.66-11.97-7.02-23.38-7.09-35.47C.41,29.07,8.44,14.99,8.68,0';

interface Alert {
  id: string;
  level: keyof typeof levels;
  username: string;
}

export const Overlay = () => {
  const [scope, animate] = useAnimate();
  const url = useVariable<Variables>('apiBaseUrl');
  if (!url) throw new Error('Missing apiBaseUrl');

  const api = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          httpSubscriptionLink({
            url,
            transformer: SuperJSON
          })
        ]
      }),
    [url]
  );

  const imageRef = useRef<HTMLImageElement>(null);
  const usernameRef = useRef<HTMLParagraphElement>(null);
  const levelTextRef = useRef<HTMLParagraphElement>(null);
  const levelLabelTextRef = useRef<HTMLParagraphElement>(null);

  const run = useCallback(
    async (alert: Alert) => {
      const level = levels[alert.level];
      const image = await loadLevelArtwork(level);
      if (!image) {
        console.error('No image found for level', alert.level);
        return;
      }

      if (!imageRef.current || !levelTextRef.current || !levelLabelTextRef.current || !usernameRef.current) {
        console.error('No refs found');
        return;
      }

      imageRef.current.src = image;
      levelTextRef.current.textContent = `lvl ${level.number.toString()}`;
      levelLabelTextRef.current.textContent = level.name;
      usernameRef.current.textContent = alert.username;

      await animate([
        ['#level-up', { y: 0, opacity: 1 }, { duration: 0 }],
        ['#level-up-text', { opacity: 0, y: 10 }, { duration: 0 }],
        ['#level-text', { opacity: 0, y: 10 }, { duration: 0 }],
        ['#level-label-text', { opacity: 0, y: 10 }, { duration: 0 }],
        ['#username', { opacity: 0, y: 10 }, { duration: 0 }],
        ['#image', { offsetDistance: '0%', top: 350 }, { duration: 0 }],
        [
          '#image',
          { offsetDistance: '100%', top: 75 },
          {
            duration: 2.5,
            ease: 'easeInOut'
          }
        ],
        ['#level-up-text', { opacity: 1, y: 0 }, { duration: 0.25 }],
        ['#username', { opacity: 1, y: 0 }, { duration: 0.25 }],
        ['#level-up-text', { opacity: 0, y: 10 }, { delay: 1, duration: 0.25 }],
        ['#level-text', { opacity: 1, y: 0 }, { duration: 0.25 }],
        ['#level-text', { opacity: 0, y: 10 }, { delay: 1, duration: 0.25 }],
        ['#level-label-text', { opacity: 1, y: 0 }, { duration: 0.25 }],
        ['#level-label-text', { opacity: 0, y: 10 }, { delay: 1, duration: 0.25 }],
        ['#level-up', { y: 300, opacity: 0 }, { duration: 0.5, ease: 'easeInOut' }]
      ]);
    },
    [animate]
  );

  const pendingAlertQueueRef = useRef(createPromiseLock());
  const onEvent = useCallback(
    (alert: Alert) => {
      pendingAlertQueueRef.current(async () => {
        await run(alert);
      });
    },
    [run]
  );

  useEffect(() => {
    const subscription = api.users.live.levelUps.subscribe(undefined, {
      onData: events => {
        for (const event of events) {
          onEvent({
            id: crypto.randomUUID(),
            level: event.level,
            username: event.username
          });
        }
      },
      onError: error => {
        console.error('Level up stream failed', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onEvent, api]);

  return (
    <div ref={scope} className="absolute inset-0 overflow-hidden text-white text-stroke-2 text-stroke-black">
      <div className="absolute bottom-0 right-0 p-20">
        <motion.div id="level-up" className="flex flex-col gap-2 items-center justify-center">
          <div className="relative h-10 w-full">
            <motion.p
              id="level-up-text"
              initial={{ opacity: 0, y: 10 }}
              className="text-3xl font-bold absolute inset-0 text-center"
            >
              Level up!
            </motion.p>
            <motion.p
              ref={levelTextRef}
              id="level-text"
              initial={{ opacity: 0, y: 10 }}
              className="text-3xl font-bold absolute inset-0 text-center"
            >
              lvl 5
            </motion.p>
            <motion.p
              ref={levelLabelTextRef}
              id="level-label-text"
              initial={{ opacity: 0, y: 10 }}
              className="text-3xl font-bold absolute inset-0 text-center"
            >
              adult butterfly
            </motion.p>
          </div>
          <motion.div
            id="image"
            style={{ offsetPath: `path("${PATH}")`, offsetRotate: 'auto', transformOrigin: '50% 5% 0' }}
            className="relative w-[150px] h-[150px] flex items-center justify-center"
            initial={{ offsetDistance: '0%', top: 400 }}
          >
            <img ref={imageRef} src={butterfly} alt="butterfly" className="h-full rotate-90" />
          </motion.div>
          <motion.p ref={usernameRef} id="username" initial={{ opacity: 0, y: 10 }} className="text-4xl font-bold">
            strangecyan
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

type Task<T> = () => Promise<T>;

// A basic but robust promise lock
export const createPromiseLock = () => {
  let tail: Promise<unknown> | undefined;

  return async function enqueue<T>(task: Task<T>): Promise<T> {
    let current: Promise<T> | undefined;
    if (tail) {
      current = tail.then(() => {
        return task();
      });
    } else {
      current = task();
    }

    tail = current
      .catch(e => {
        // If the current task fails, we need to reset the tail
        tail = undefined;
        throw e;
      })
      .finally(() => {
        // If the current task succeeds, we need to reset the tail
        // If the current task is not the tail, we need to keep the tail
        // so that the next task can run
        if (tail === current) {
          tail = undefined;
        }
      });

    return tail as Promise<T>;
  };
};
