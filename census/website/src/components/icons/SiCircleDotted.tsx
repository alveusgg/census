import type { SVGProps } from 'react';
const SiCircleDotted = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
      d="M12 5v.01m3.502.928-.005.01m2.57 2.554-.01.005m.948 3.497h-.01m-.928 3.502-.009-.005m-2.555 2.57-.005-.01M12 19v.01m-3.498-.947-.005.009m-2.555-2.57-.008.005m-.929-3.502h-.01m.947-3.498-.008-.005m2.568-2.555-.005-.008"
    />
  </svg>
);
export default SiCircleDotted;
