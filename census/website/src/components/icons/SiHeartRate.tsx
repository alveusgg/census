import type { SVGProps } from 'react';
const SiHeartRate = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="#141414"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m11.75 16.75 1.25 1.5s5.025-6.058 5.883-7.732c.857-1.675.162-3.71-1.553-4.548-1.525-.744-3.343.534-4.33 1.82-.987-1.286-2.805-2.564-4.33-1.82-1.542.753-2.26 2.474-1.766 4.03l.08.254M4.75 12.75H8l1 3.5 2-5.5 2 2h1.25"
    />
  </svg>
);
export default SiHeartRate;
