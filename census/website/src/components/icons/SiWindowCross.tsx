import type { SVGProps } from 'react';
const SiWindowCross = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.25 8.25v-.5a2 2 0 0 0-2-2H6.75a2 2 0 0 0-2 2v.5m14.5 0H4.75m14.5 0v4m-14.5-4v8a2 2 0 0 0 2 2h5.5m3.5-2.5 1.75 1.75m0 0 1.75 1.75M17.5 17.5l1.75-1.75M17.5 17.5l-1.75 1.75"
    />
  </svg>
);
export default SiWindowCross;
