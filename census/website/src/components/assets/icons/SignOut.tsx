import { FC, SVGAttributes } from 'react';

export const SignOut: FC<SVGAttributes<SVGSVGElement>> = ({ ...props }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path
        d="M6.83329 3.16666H4.49996C3.76358 3.16666 3.16663 3.76362 3.16663 4.5V12.8333H10.1666V8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.16663 12.8333H12.8333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M11.1666 6.16666L12.8333 4.66666M12.8333 4.66666L11.1666 3.16666M12.8333 4.66666H9.16663"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33329 8C8.33329 8.18406 8.18403 8.33333 7.99996 8.33333C7.81589 8.33333 7.66663 8.18406 7.66663 8C7.66663 7.81593 7.81589 7.66666 7.99996 7.66666C8.18403 7.66666 8.33329 7.81593 8.33329 8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
