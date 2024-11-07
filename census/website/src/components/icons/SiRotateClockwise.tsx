import type { SVGProps } from 'react';
const SiRotateClockwise = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 18.25A6.25 6.25 0 1 1 17.25 12v2.385m-2.5-1.635 2.25 2.5 2.25-2.5"
    />
  </svg>
);
export default SiRotateClockwise;
