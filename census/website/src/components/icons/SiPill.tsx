import type { SVGProps } from 'react';
const SiPill = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.0061 12L12 5.9939C10.3415 4.33537 7.65244 4.33537 5.9939 5.9939C4.33537 7.65244 4.33537 10.3415 5.9939 12L12 18.0061C13.6585 19.6646 16.3476 19.6646 18.0061 18.0061C19.6646 16.3476 19.6646 13.6585 18.0061 12Z"
    />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L15 9" />
  </svg>
);
export default SiPill;
