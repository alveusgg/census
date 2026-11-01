import { Section, Step } from '@/components/wrapped';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { season } from './data';
import { Confetti, CountUp, Headline, Slide, Stat } from './primitives';

import anthill from '@/assets/anthill.outlined.png';

export const PointsSection: FC = () => (
  <Section wait={2500}>
    <Step>
      <Slide className="justify-center">
        <Stat
          value={<CountUp value={season.points} duration={2} />}
          caption="points earned by the whole community"
          className="shrink-0 wide:items-center wide:text-center"
          valueClassName="text-5xl wide:text-8xl"
        />
      </Slide>
    </Step>
  </Section>
);

export const ThanksSection: FC = () => (
  <Section wait={1000}>
    <Step>
      <Slide className="relative wide:justify-center wide:gap-14">
        <Confetti pieces={220} delay={0.4} className="-inset-x-8 -inset-y-6 z-0" />
        <motion.img
          src={anthill}
          alt=""
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="relative z-10 max-h-52 w-full max-w-xs object-contain drop-shadow-lg wide:max-h-72 wide:max-w-sm"
        />
        <Stat
          value={<Headline>thank you!</Headline>}
          caption="none of this happens without every spotter, commenter and voter. see you next season."
          className="relative z-10 shrink-0 wide:w-[22rem]"
        />
      </Slide>
    </Step>
  </Section>
);
