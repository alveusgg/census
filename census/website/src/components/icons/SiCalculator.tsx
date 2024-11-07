import type { SVGProps } from 'react';
const SiCalculator = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="#141414"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5.75 7.25h12.5m-9.5 6h.5m-.5-3h.5m-.5 6h.5m2.5-3h.5m-.5-3h.5m-.5 6h.5m2.5-3h.5m-.5-3h.5m-.5 6h.5m-7.5 3h8.5a2 2 0 0 0 2-2V6.75a2 2 0 0 0-2-2h-8.5a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2Z"
    />
  </svg>
);
export default SiCalculator;
