import type { SVGProps } from 'react';
const SiTriangle = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4.96873 16.3536L10.2052 5.85659C10.9418 4.38482 13.0388 4.38521 13.7748 5.85724L19.0391 16.3543C19.704 17.6842 18.7388 19.25 17.2541 19.25H6.75335C5.26832 19.25 4.30314 17.6835 4.96873 16.3536Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiTriangle;
