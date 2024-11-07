import type { SVGProps } from 'react';
const SiPen = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4.75 19.25L9 18.25L18.5625 8.6875C19.46 7.79004 19.46 6.33496 18.5625 5.4375C17.665 4.54004 16.21 4.54004 15.3125 5.4375L5.75 15L4.75 19.25Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiPen;
