import type { SVGProps } from 'react';
const SiAlignHorizontalCenter = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M13.2502 17.25H10.75C9.64543 17.25 8.75 16.3546 8.75 15.25V8.75C8.75 7.64543 9.64543 6.75 10.75 6.75H13.2502C14.3548 6.75 15.2502 7.64543 15.2502 8.75V15.25C15.2502 16.3546 14.3548 17.25 13.2502 17.25Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19.25 4.75V19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.75 4.75V19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiAlignHorizontalCenter;
