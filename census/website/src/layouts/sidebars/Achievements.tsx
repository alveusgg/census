import { Counter } from '@/components/animation/Counter';
import { Button } from '@/components/controls/button/juicy';
import { useConfetti } from '@/components/layout/ConfettiProvider';
import { useAchievements } from '@/components/layout/LayoutProvider';
import { useModal } from '@/components/modal/useModal';
import { usePointAction } from '@/components/points/hooks';
import { PointDestination } from '@/components/points/PointDestination';
import { PointOrigin } from '@/components/points/PointOrigin';
import {
  usePatchAchievement,
  usePendingAchievements,
  usePoints,
  useRedeemAchievement,
  useRedeemAllAchievements
} from '@/services/api/me';
import { useCurrentSeason } from '@/services/api/seasons';
import { cn } from '@/utils/cn';
import { levels } from '@alveusgg/census-levels';
import { AnimatePresence, HTMLMotionProps, motion, useAnimate } from 'framer-motion';
import { FC, PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { LevelUpModal } from './LevelUpModal';

const getLevelForPoints = (points: number) => {
  const level = Object.values(levels).reduce((acc, level) => {
    if (points >= level.points) return level;
    return acc;
  }, levels.newcomer);
  if (!level) return 0;
  return level.number;
};

export const Achievements = () => {
  const [open, setOpen] = useAchievements();
  const season = useCurrentSeason();
  const points = usePoints(season.data.startDate);
  const pending = usePendingAchievements();

  const redeemAll = useRedeemAllAchievements();
  const level = useMemo(() => getLevelForPoints(points.data), [points.data]);
  const [knownLevel, setKnownLevel] = useState<number | null>(null);

  const levelUpModalProps = useModal<{ level: number }>();

  const confetti = useConfetti();
  useEffect(() => {
    if (knownLevel !== level) {
      setKnownLevel(level);
      if (knownLevel !== null) {
        setTimeout(() => {
          levelUpModalProps.open({ level });
          confetti();
        }, 3000);
      }
    }
  }, [level]);

  return (
    <>
      <LevelUpModal {...levelUpModalProps} />
      <motion.div
        className="flex flex-col z-40 fixed md:relative right-2 top-2 bottom-2 md:top-auto md:bottom-auto md:right-auto antialiased"
        animate={{ width: open ? '16rem' : '0' }}
        transition={{ ease: 'backInOut', duration: 0.4 }}
      >
        <div className="absolute left-2 bottom-0 drop-shadow-xl md:drop-shadow-none top-0 flex flex-col min-w-[15.5rem] w-[15.5rem] rounded-md bg-[#B068F8] flex-1 border border-[#9C51E7]">
          <Button
            onClick={() => setOpen(value => !value)}
            className="absolute overflow-visible -left-12 top-1 h-14 w-12 pr-3 text-white font-bold text-lg bg-[#B068F8] hover:bg-[#9d51e8] rounded-r-none"
          >
            <div className="flex relative -top-[0.050rem] items-center flex-col justify-center leading-4">
              <AnimatePresence>
                {pending.data.length > 0 && (
                  <motion.span
                    initial={{ opacity: 1, top: -4, left: -18, scale: 0.8 }}
                    animate={{ opacity: 1, top: -8, left: -19, scale: 1.2 }}
                    exit={{ opacity: 1, top: -8, left: -19, scale: 0, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 800, damping: 20 }}
                    className="w-3 h-3 rounded-full bg-red-500 border border-red-600 absolute"
                  />
                )}
              </AnimatePresence>
              <span className="text-xs">lvl</span>
              <span>{getLevelForPoints(points.data)}</span>
            </div>
          </Button>
          <div className="m-4 relative h-16">
            <PointDestination />
            <div className="bg-[#A356F0] absolute left-0 right-0 top-0 h-16 border flex items-center justify-center shadow-inner border-[#8D40DB] rounded-xl z-20 p-3 text-center text-white font-bold text-4xl font-mono">
              <Counter duration={1} delay={2}>
                {points.data}
              </Counter>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 font-sans text-left overflow-y-scroll p-4 flex-1">
            {pending.data.length > 0 && (
              <div className="flex justify-between items-center text-white">
                <p className="font-semibold text-sm">achievements</p>

                <button
                  className="font-semibold opacity-80 text-xs py-1 px-2 hover:bg-[#A356F0] rounded-md"
                  onClick={() => redeemAll.mutate()}
                >
                  redeem all
                </button>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {pending.data.length > 0 ? (
                pending.data.map(achievement => (
                  <Achievement
                    type={achievement.payload.type}
                    className="bg-[#A356F0] hover:bg-[#9346e0] border border-[#8D40DB] rounded-md flex font-medium px-3 py-2.5 text-white"
                    key={achievement.id}
                    id={achievement.id}
                    points={achievement.points}
                  >
                    {achievement.payload.type === 'onboard' && (
                      <>
                        <div className="flex justify-between">
                          <p className="font-semibold text-left">🎉 Congrats!</p>
                          <span className="font-bold text-sm">{achievement.points} pts</span>
                        </div>
                        <p className="mt-1 text-left text-sm leading-tight">{achievement.payload.payload.message}</p>
                      </>
                    )}

                    {achievement.payload.type === 'shiny' && achievement.identification && (
                      <>
                        <div className="flex justify-between">
                          <p className="font-semibold text-left">🌟 Congrats!</p>
                          <span className="font-bold text-sm">{achievement.points} pts</span>
                        </div>
                        <p className="mt-1 text-left text-sm leading-tight">
                          You identified one of Dr. Allison's shinies! Well done!{' '}
                          <span className="font-bold">{achievement.identification.nickname}</span>
                        </p>
                      </>
                    )}

                    {achievement.payload.type === 'identify' && achievement.identification && (
                      <>
                        <div className="flex justify-between">
                          <p className="font-semibold text-left">🔬 Congrats!</p>
                          <span className="font-bold text-sm">{achievement.points} pts</span>
                        </div>
                        <p className="mt-1 text-left text-sm leading-tight">
                          You successfully identified a{' '}
                          <span className="font-bold">{achievement.identification.nickname}!</span> Well done!
                        </p>
                      </>
                    )}
                  </Achievement>
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.9, y: 0 }}
                  transition={{ delay: 1 }}
                  className="text-white text-balance font-semibold w-36 text-center mx-auto leading-4"
                >
                  no achievements to redeem
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
};

interface AchievementProps {
  id: number;
  points: number;
  type: 'identify' | 'shiny' | string;
}

const Achievement: FC<PropsWithChildren<AchievementProps & Omit<HTMLMotionProps<'button'>, 'id' | 'type'>>> = ({
  id,
  points,
  children,
  className,
  type,
  ...props
}) => {
  const action = usePointAction();
  const redeem = useRedeemAchievement();
  const patch = usePatchAchievement();
  const [redeemedRef, animate] = useAnimate();
  const containerRef = useRef<HTMLDivElement>(null);

  const confetti = useConfetti();

  const handleRedeem = async () => {
    if (type === 'shiny' || type === 'identify') confetti();
    if (!containerRef.current) throw new Error('No container ref');
    await animate(containerRef.current, { opacity: 0.5 }, { duration: 0.2 });
    await Promise.all([redeem.mutateAsync(id), action.add(points)]);
    await animate(redeemedRef.current, { opacity: 1, top: 0, rotate: 2, zIndex: 10 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    patch(id);
  };

  return (
    <motion.button
      layout="position"
      exit={{ opacity: 0, y: -5 }}
      transition={{ ease: 'backInOut', duration: 0.4 }}
      onClick={handleRedeem}
      className={cn(className, 'relative')}
      {...props}
    >
      <motion.span
        ref={redeemedRef}
        initial={{ opacity: 0, top: 5, rotate: 0, zIndex: 10 }}
        animate={{ opacity: 0, top: 5, rotate: 0, zIndex: 10 }}
        className="bg-white px-2 py-1.5 rounded-lg absolute -right-2 text-[#A356F0] text-sm shadow-lg font-semibold"
      >
        redeemed
      </motion.span>
      <PointOrigin {...action}>
        <div ref={containerRef}>{children}</div>
      </PointOrigin>
    </motion.button>
  );
};
