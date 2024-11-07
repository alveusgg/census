import type { SVGProps } from 'react';
const SiShapes = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 5.75C15 7.5 13.5 9 11.75 9 13.5 9 15 10.5 15 12.25 15 10.5 16.5 9 18.25 9 16.5 9 15 7.5 15 5.75Zm-7 8C8 16 8 16 5.75 16 8 16 8 16 8 18.25 8 16 8 16 10.25 16 8 16 8 16 8 13.75Zm9 1L14.75 17 17 19.25 19.25 17 17 14.75Zm-10-9L5.75 7 7 8.25 8.25 7 7 5.75Z"
    />
  </svg>
);
export default SiShapes;
