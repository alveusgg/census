import type { SVGProps } from 'react';
const SiEraser = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M7 15.25L4.75 13L11.2929 6.45711C11.6834 6.06658 12.3166 6.06658 12.7071 6.45711L15.5429 9.29289C15.9334 9.68342 15.9334 10.3166 15.5429 10.7071L11 15.25H7Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12.75 19.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiEraser;
