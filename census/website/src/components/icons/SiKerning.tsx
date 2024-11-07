import type { SVGProps } from 'react';
const SiKerning = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19.25 4.75V19.25M7.75 16.25L9.25 13.25M9.25 13.25L12 7.75L14.75 13.25M9.25 13.25H14.75M14.75 13.25L16.25 16.25M4.75 4.75V19.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiKerning;
