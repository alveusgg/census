import type { SVGProps } from 'react';
const SiAlignVerticalCenter = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4.75 4.75H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.75 19.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M6.75 13.2502L6.75 10.75C6.75 9.64543 7.64543 8.75 8.75 8.75L15.25 8.75C16.3546 8.75 17.25 9.64543 17.25 10.75V13.2502C17.25 14.3548 16.3546 15.2502 15.25 15.2502L8.75 15.2502C7.64543 15.2502 6.75 14.3548 6.75 13.2502Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiAlignVerticalCenter;
