import type { SVGProps } from 'react';
const SiSign = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M10.75 13.25V19.25M10.75 4.75V6.75M4.75 7.75V12.25C4.75 12.8023 5.19772 13.25 5.75 13.25H16.25L19.25 10L16.25 6.75H5.75C5.19772 6.75 4.75 7.19772 4.75 7.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiSign;
