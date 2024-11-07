import type { SVGProps } from 'react';
const SiBorders = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M16.25 19.25H7.75M19.25 7.75V16.25M4.75 7.75L4.75 16.25M16.25 4.75L7.75 4.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiBorders;
