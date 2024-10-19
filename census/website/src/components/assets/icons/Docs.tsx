import { FC, SVGAttributes } from 'react';

export const Docs: FC<SVGAttributes<HTMLOrSVGElement>> = props => {
  return (
    <svg width="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M8.50004 3.16667H5.16671C4.43033 3.16667 3.83337 3.76362 3.83337 4.5V11.5C3.83337 12.2364 4.43033 12.8333 5.16671 12.8333H10.8334C11.5698 12.8333 12.1667 12.2364 12.1667 11.5V6.83333M8.50004 3.16667V5.5C8.50004 6.23638 9.09697 6.83333 9.83337 6.83333H12.1667M8.50004 3.16667L12.1667 6.83333"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83337 10.5H10.1667"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83337 8.5H7.50004"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
