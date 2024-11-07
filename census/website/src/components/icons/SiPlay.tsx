import type { SVGProps } from 'react';
const SiPlay = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.25 12L5.75 5.75V18.25L18.25 12Z"
    />
  </svg>
);
export default SiPlay;
