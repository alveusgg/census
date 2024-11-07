import type { SVGProps } from 'react';
const SiSend = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 19.25L12 4.75L19.25 19.25L12 15.75L4.75 19.25Z"
    />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.5V12.75" />
  </svg>
);
export default SiSend;
