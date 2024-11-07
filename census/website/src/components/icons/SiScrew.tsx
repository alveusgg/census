import type { SVGProps } from 'react';
const SiScrew = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9.75 8.25H6.75V4.75H9.5L12 5.75L14.5 4.75H17.25V8.25H14.25M9.75 8.25V17L12 19.25L14.25 17V8.25M9.75 8.25H14.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 11L10 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 14L10 15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiScrew;
