import type { SVGProps } from 'react';
const SiBulbCheck = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7.75 16.75V16c0-1.5-3-2-3-6 0-2.5 1.75-5.25 5.25-5.25.854 0 1.604.164 2.25.448M7.75 16.75v1.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-1.5m-4.5 0h4.5m0 0V16c0-1.203 1.93-1.763 2.694-4m4.306-7.25s-1.929 2.09-2.893 4.5L14.75 7.321"
    />
  </svg>
);
export default SiBulbCheck;
