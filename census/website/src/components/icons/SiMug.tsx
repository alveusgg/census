import type { SVGProps } from 'react';
const SiMug = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M7.25 6.75H6.75C5.64543 6.75 4.75 7.64543 4.75 8.75V11.25C4.75 12.3546 5.64543 13.25 6.75 13.25H7.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.25 4.75H7.75V14.25C7.75 15.3546 8.64543 16.25 9.75 16.25H17.25C18.3546 16.25 19.25 15.3546 19.25 14.25V4.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19.25 19.25H4.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiMug;
