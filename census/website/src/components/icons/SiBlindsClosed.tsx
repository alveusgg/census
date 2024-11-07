import type { SVGProps } from 'react';
const SiBlindsClosed = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M17.5833 4.75H6.41667C5.49619 4.75 4.75 5.49619 4.75 6.41667C4.75 6.8769 5.1231 7.25 5.58333 7.25H18.4167C18.8769 7.25 19.25 6.8769 19.25 6.41667C19.25 5.49619 18.5038 4.75 17.5833 4.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 18.5V19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M5.75 7.5V18.25H18.25V7.5"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiBlindsClosed;
