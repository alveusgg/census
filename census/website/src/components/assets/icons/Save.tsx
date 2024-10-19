import { FC, SVGAttributes } from 'react';

export const Save: FC<SVGAttributes<SVGSVGElement>> = ({ ...props }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M4.49999 12.8333H11.5C12.2364 12.8333 12.8333 12.2364 12.8333 11.5V6.55228C12.8333 6.19865 12.6929 5.85952 12.4428 5.60946L10.3905 3.55718C10.1405 3.30713 9.80132 3.16666 9.44772 3.16666H4.49999C3.76361 3.16666 3.16666 3.76361 3.16666 4.49999V11.5C3.16666 12.2364 3.76361 12.8333 4.49999 12.8333Z"
      stroke="#431C05"
      fill="#F5EFD7"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.83334 12.6667V10.5C5.83334 10.1318 6.13182 9.83334 6.50001 9.83334H9.50001C9.86821 9.83334 10.1667 10.1318 10.1667 10.5V12.6667"
      stroke="#431C05"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.83334 3.33334V5.50001"
      stroke="#431C05"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
