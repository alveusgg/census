import type { SVGProps } from 'react';
const SiDiamond = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.875 4.75h6.25m-6.25 0-4.125 5.5m4.125-5.5L12 10.25m-7.25 0 7.25 9 7.25-9m-14.5 0H12m7.25 0-4.125-5.5m4.125 5.5H12m3.125-5.5L12 10.25"
    />
  </svg>
);
export default SiDiamond;
