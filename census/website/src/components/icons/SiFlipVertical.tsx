import type { SVGProps } from 'react';
const SiFlipVertical = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.25 12h-4.5m4.5 0-2.5-2.25M9.25 12l-2.5 2.25m8-2.25h4.5m-4.5 0 2.5-2.25M14.75 12l2.5 2.25M12 4.75v1.5m0 2.5v.5m0 2.5v.5m0 2.5v.5m0 2.5v1.5"
    />
  </svg>
);
export default SiFlipVertical;
