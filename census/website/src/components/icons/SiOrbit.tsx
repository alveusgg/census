import type { SVGProps } from 'react';
const SiOrbit = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19.25a7.25 7.25 0 0 0 5.933-11.418M12 4.75a7.25 7.25 0 0 0-5.933 11.418m11.866-8.336a1.25 1.25 0 1 0-1.866-1.664 1.25 1.25 0 0 0 1.866 1.664ZM6.067 16.168a1.25 1.25 0 1 0 1.866 1.664 1.25 1.25 0 0 0-1.866-1.664ZM14.25 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
    />
  </svg>
);
export default SiOrbit;
