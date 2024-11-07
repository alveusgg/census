import type { SVGProps } from 'react';
const SiTwitch = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M18.25 4.75H5.75C5.19772 4.75 4.75 5.19772 4.75 5.75V15.25C4.75 15.8023 5.19772 16.25 5.75 16.25H7.75V19.25L11 16.25H17L19.25 14V5.75C19.25 5.19772 18.8023 4.75 18.25 4.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15.25 9.75V12.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.25 9.75V12.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiTwitch;
