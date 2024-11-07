import type { SVGProps } from 'react';
const SiMagicMouse = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M6.75 10C6.75 7.10051 9.10051 4.75 12 4.75C14.8995 4.75 17.25 7.10051 17.25 10V14C17.25 16.8995 14.8995 19.25 12 19.25C9.10051 19.25 6.75 16.8995 6.75 14V10Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 8.75V10.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiMagicMouse;
