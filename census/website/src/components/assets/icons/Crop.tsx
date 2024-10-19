import { FC, SVGAttributes } from 'react';

export const Crop: FC<SVGAttributes<SVGSVGElement>> = props => (
  <svg width="22" height="22" viewBox="0 0 22 22" {...props} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.35416 7.10416H13.9792C14.4854 7.10416 14.8958 7.51457 14.8958 8.02082V17.6458"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.6458 14.8958H8.02083C7.51457 14.8958 7.10416 14.4854 7.10416 13.9792V4.35416"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
