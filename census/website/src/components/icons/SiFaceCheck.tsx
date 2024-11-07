import type { SVGProps } from 'react';
const SiFaceCheck = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path stroke="currentColor" d="M10.5 11a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm4 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.25 12A7.25 7.25 0 1 1 12 4.75m2.75 2 1.5 1.5c.75-2.25 3-3.5 3-3.5m-9.5 10s.75 1 2.25 1 2.25-1 2.25-1"
    />
  </svg>
);
export default SiFaceCheck;
