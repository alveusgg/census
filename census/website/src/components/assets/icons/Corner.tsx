import { FC, SVGAttributes } from 'react';

export const Corner: FC<SVGAttributes<SVGSVGElement>> = props => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.5 21C0.5 22.3807 1.61929 23.5 3 23.5C4.38071 23.5 5.5 22.3807 5.5 21L5.5 8C5.5 6.61929 6.61929 5.5 8 5.5L21 5.5C22.3807 5.5 23.5 4.38071 23.5 3C23.5 1.61929 22.3807 0.499999 21 0.499999L8 0.5C3.85786 0.5 0.499999 3.85786 0.499999 8L0.5 21Z"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
