import type { SVGProps } from 'react';
const SiSlideshow = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4.75 4.75H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.75 19.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M6.75 16.2502H17.25C18.3546 16.2502 19.25 15.3548 19.25 14.2502V9.75C19.25 8.64543 18.3546 7.75 17.25 7.75H6.75C5.64543 7.75 4.75 8.64543 4.75 9.75V14.2502C4.75 15.3548 5.64543 16.2502 6.75 16.2502Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiSlideshow;
