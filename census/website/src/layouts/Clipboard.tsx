import { cn } from '@/utils/cn';
import { HTMLMotionProps, motion } from 'framer-motion';
import { FC, HTMLAttributes, PropsWithChildren, SVGAttributes } from 'react';

interface ClipboardProps extends HTMLAttributes<HTMLDivElement> {
  clip?: boolean;
  container?: HTMLMotionProps<'div'>;
}

export const Clipboard: FC<PropsWithChildren<ClipboardProps>> = ({ clip = true, children, container, ...inner }) => {
  return (
    <motion.div
      {...container}
      style={{
        borderRadius: '1rem'
      }}
      initial={{
        y: 40,
        scale: 1.05
      }}
      animate={{
        y: 0,
        scale: 1
      }}
      className={cn(
        'md:bg-[#BF896D] w-full mx-auto max-w-3xl relative md:p-2.5 @container md:mt-8',
        container?.className
      )}
    >
      {clip && <Clip className="absolute hidden md:inline -top-12 left-1/2 -translate-x-1/2" />}
      <div
        style={{
          borderRadius: '0.5rem'
        }}
        {...inner}
        className={cn('md:bg-accent-50 h-fit min-h-full md:px-12 md:py-20', inner.className)}
      >
        {children}
      </div>
    </motion.div>
  );
};

const Clip: FC<SVGAttributes<SVGSVGElement>> = props => (
  <svg width="155" height="74" viewBox="0 0 155 74" fill="none" {...props} xmlns="http://www.w3.org/2000/svg">
    <mask id="path-1-outside-1_197_1464" maskUnits="userSpaceOnUse" x="4" y="0" width="147" height="39" fill="black">
      <rect fill="white" x="4" width="147" height="39" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M145.072 37C136.74 30.6173 126.243 27.6013 115.262 27.5552C113.466 20.1682 109.354 14.1755 103.621 9.86343C96.43 4.45499 87.1351 2 77.5431 2C67.9454 2 58.6498 4.45456 51.4594 9.86401C45.7269 14.1767 41.618 20.1696 39.8238 27.5552C28.8376 27.599 18.3353 30.6148 10 37H145.072Z"
      />
    </mask>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M145.072 37C136.74 30.6173 126.243 27.6013 115.262 27.5552C113.466 20.1682 109.354 14.1755 103.621 9.86343C96.43 4.45499 87.1351 2 77.5431 2C67.9454 2 58.6498 4.45456 51.4594 9.86401C45.7269 14.1767 41.618 20.1696 39.8238 27.5552C28.8376 27.599 18.3353 30.6148 10 37H145.072Z"
      fill="rgba(var(--accent-color-100) / var(--tw-bg-opacity))"
    />
    <path
      d="M145.072 37V39H150.972L146.288 35.4123L145.072 37ZM115.262 27.5552L113.319 28.0276L113.688 29.5486L115.254 29.5552L115.262 27.5552ZM103.621 9.86343L102.419 11.4618L102.419 11.4618L103.621 9.86343ZM51.4594 9.86401L52.6618 11.4622L52.6618 11.4622L51.4594 9.86401ZM39.8238 27.5552L39.8317 29.5552L41.3976 29.5489L41.7672 28.0273L39.8238 27.5552ZM10 37L8.78376 35.4123L4.10037 39H10V37ZM146.288 35.4123C137.548 28.7163 126.603 25.6028 115.27 25.5552L115.254 29.5552C125.884 29.5998 135.933 32.5183 143.856 38.5877L146.288 35.4123ZM117.205 27.0828C115.297 19.2331 110.916 12.8472 104.823 8.26504L102.419 11.4618C107.793 15.5037 111.636 21.1033 113.319 28.0276L117.205 27.0828ZM104.823 8.26505C97.2039 2.5345 87.4541 0 77.5431 0V4C86.8162 4 95.6561 6.37548 102.419 11.4618L104.823 8.26505ZM77.5431 0C67.6268 0 57.8759 2.53395 50.2571 8.26579L52.6618 11.4622C59.4236 6.37517 68.2641 4 77.5431 4V0ZM50.2571 8.26579C44.1652 12.8489 39.7869 19.235 37.8803 27.083L41.7672 28.0273C43.4492 21.1042 47.2886 15.5046 52.6618 11.4622L50.2571 8.26579ZM39.8158 25.5552C28.4782 25.6004 17.5282 28.7137 8.78376 35.4123L11.2162 38.5877C19.1424 32.5159 29.197 29.5975 39.8317 29.5552L39.8158 25.5552ZM10 39H145.072V35H10V39Z"
      fill="rgba(var(--accent-color-100) / var(--tw-bg-opacity))"
      mask="url(#path-1-outside-1_197_1464)"
    />
    <path
      d="M114.97 33.5547H109.19C108.321 16.7025 94.4546 8 77.5074 8C60.5471 8 46.6942 16.7025 45.8251 33.5547H40.031C17.9217 33.5547 0 47.0365 0 74H155C155 47.0365 137.08 33.5547 114.97 33.5547ZM75.8226 41.125C68.1191 41.125 61.8645 36.5958 61.8645 31.0137C61.8645 25.4316 68.1194 20.9024 75.8226 20.9024C83.5261 20.9024 89.7807 25.4316 89.7807 31.0137C89.7807 36.5958 83.5257 41.125 75.8226 41.125Z"
      fill="white"
    />
    <path
      d="M114.97 33.5547H109.19C108.321 16.7025 94.4546 8 77.5074 8C60.5471 8 46.6942 16.7025 45.8251 33.5547H40.031C17.9217 33.5547 0 47.0365 0 74H155C155 47.0365 137.08 33.5547 114.97 33.5547ZM75.8226 41.125C68.1191 41.125 61.8645 36.5958 61.8645 31.0137C61.8645 25.4316 68.1194 20.9024 75.8226 20.9024C83.5261 20.9024 89.7807 25.4316 89.7807 31.0137C89.7807 36.5958 83.5257 41.125 75.8226 41.125Z"
      fill="url(#paint0_linear_197_1464)"
      fillOpacity="0.5"
    />
    <defs>
      <linearGradient id="paint0_linear_197_1464" x1="77.5" y1="8" x2="77.5" y2="74" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6F6F6F" />
        <stop offset="0.425" stopColor="#757575" />
        <stop offset="0.5" stopColor="#828181" />
        <stop offset="0.59" stopColor="#797878" />
        <stop offset="1" stopColor="#737070" />
      </linearGradient>
    </defs>
  </svg>
);
