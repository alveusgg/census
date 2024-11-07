import type { SVGProps } from 'react';
const SiTree = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19.25V13m0 0-1.25-1.22M12 13l1.25-1.25m-2.288-6.41-5.088 9.364c-.386.71.175 1.546 1.039 1.546h10.174c.864 0 1.425-.836 1.039-1.546L13.038 5.34c-.427-.788-1.649-.788-2.076 0Z"
    />
  </svg>
);
export default SiTree;
