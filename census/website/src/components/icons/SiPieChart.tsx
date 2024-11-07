import type { SVGProps } from 'react';
const SiPieChart = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <circle
      cx={12}
      cy={12}
      r={7.25}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.75 5V10.25C11.75 11.3546 12.6454 12.25 13.75 12.25H19"
    />
  </svg>
);
export default SiPieChart;
