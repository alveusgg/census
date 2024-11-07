import type { SVGProps } from 'react';
const SiWaves = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 12.25c0-4.556 3.694-6.5 8.25-6.5A3.25 3.25 0 1 0 16.25 9a3.25 3.25 0 0 0 3.25 3.25M4.75 17s3.107-2.813 7.25 0 7.25 0 7.25 0"
    />
  </svg>
);
export default SiWaves;
