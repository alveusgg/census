import type { SVGProps } from 'react';
const SiBezierCurve = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.25 8.75h-5.5m13.5 4.5s-.589-3.534-4.55-4.338m-3.4 0c-3.961.804-4.55 4.338-4.55 4.338m13.5-4.5h-5.5m-.5.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm-6 6a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm12 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
    />
  </svg>
);
export default SiBezierCurve;
