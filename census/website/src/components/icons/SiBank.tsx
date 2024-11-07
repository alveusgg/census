import type { SVGProps } from 'react';
const SiBank = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.25 11.5V19.25M5.75 19.25V11.5M9.75 19.25V11.5M14.25 19.25V11.5"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.75L19.25 11.25H4.75L12 4.75Z"
    />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.75 19.25H19.25" />
  </svg>
);
export default SiBank;
