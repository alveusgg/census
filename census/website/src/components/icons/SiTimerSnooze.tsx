import type { SVGProps } from 'react';
const SiTimerSnooze = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.25 12A7.25 7.25 0 1 1 12 4.75m.25 4V12l-1.5 1.25m6-8.5h2.5l-2.5 3.5h2.5"
    />
  </svg>
);
export default SiTimerSnooze;
