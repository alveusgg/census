import type { SVGProps } from 'react';
const SiBorderCentre = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18 9v.01M6 9v.01M18 15v.01M6 15v.01M9 18v.01M9 6v.01M6 18v.01M6 6v.01M15 18v.01M15 6v.01M18 18v.01M18 6v.01m.25 5.99H5.75M12 18.25V5.75"
    />
  </svg>
);
export default SiBorderCentre;
