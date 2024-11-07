import type { SVGProps } from 'react';
const SiPaintbrush = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M17.25 4.75H15.25L12.25 8.25V4.75H6.75V12.25H17.25V4.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.25 11V13.25C17.25 14.3546 16.3546 15.25 15.25 15.25H14.25V18.25C14.25 18.8023 13.8023 19.25 13.25 19.25H10.75C10.1977 19.25 9.75 18.8023 9.75 18.25V15.25H8.75C7.64543 15.25 6.75 14.3546 6.75 13.25V11"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiPaintbrush;
