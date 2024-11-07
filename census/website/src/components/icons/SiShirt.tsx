import type { SVGProps } from 'react';
const SiShirt = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.75c-1.5 0-2-2-2-2L4.75 8v3.25h2.5v8h9.5v-8h2.5V8L14 4.75s-.5 2-2 2Z"
    />
  </svg>
);
export default SiShirt;
