import type { SVGProps } from 'react';
const SiShield = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.75L4.75001 8C4.75001 8 4.00001 19.25 12 19.25C20 19.25 19.25 8 19.25 8L12 4.75Z"
    />
  </svg>
);
export default SiShield;
