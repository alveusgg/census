import type { SVGProps } from 'react';
const SiNeedle = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m16.25 7.75-.5.5H9.115a4 4 0 0 1-3.43-1.942L4.75 4.75m12 10v.023a5 5 0 0 0 1.655 3.717l.845.76m-.63-13.87C22.808 9.568 4.75 19.25 4.75 19.25S14.432 1.193 18.62 5.38Z"
    />
  </svg>
);
export default SiNeedle;
