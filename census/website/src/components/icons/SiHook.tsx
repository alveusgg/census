import type { SVGProps } from 'react';
const SiHook = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 7.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm0 0V8c0 2.4-4.25 4-4.25 7s1.903 4.25 4.25 4.25A4.25 4.25 0 0 0 16.25 15"
    />
  </svg>
);
export default SiHook;
