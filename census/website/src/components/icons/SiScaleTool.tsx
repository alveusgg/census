import type { SVGProps } from 'react';
const SiScaleTool = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7.75 11.25v-3.5m0 0h3.5m-3.5 0 8.5 8.5m0 0v-3.5m0 3.5h-3.5m-8-7v-4.5h4.5m10 10v4.5h-4.5"
    />
  </svg>
);
export default SiScaleTool;
