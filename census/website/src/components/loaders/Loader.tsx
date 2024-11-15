import { FC, SVGAttributes } from 'react';

export const Loader: FC<SVGAttributes<SVGSVGElement>> = ({ className, ...props }) => {
  return (
    <svg width="20" height="20" className={className} viewBox="0 0 64 64" stroke="currentColor" {...props}>
      <g strokeWidth="7" strokeLinecap="round">
        <line x1="10" x2="10">
          <animate attributeName="y1" dur="1000ms" values="16;18;28;18;16;16" repeatCount="indefinite"></animate>
          <animate attributeName="y2" dur="1000ms" values="48;46;36;44;48;48" repeatCount="indefinite"></animate>
          <animate
            attributeName="stroke-opacity"
            dur="1000ms"
            values="1;.4;.5;.8;1;1"
            repeatCount="indefinite"
          ></animate>
        </line>
        <line x1="24" x2="24">
          <animate attributeName="y1" dur="1000ms" values="16;16;18;28;18;16" repeatCount="indefinite"></animate>
          <animate attributeName="y2" dur="1000ms" values="48;48;46;36;44;48" repeatCount="indefinite"></animate>
          <animate
            attributeName="stroke-opacity"
            dur="1000ms"
            values="1;1;.4;.5;.8;1"
            repeatCount="indefinite"
          ></animate>
        </line>
        <line x1="38" x2="38">
          <animate attributeName="y1" dur="1000ms" values="18;16;16;18;28;18" repeatCount="indefinite"></animate>
          <animate attributeName="y2" dur="1000ms" values="44;48;48;46;36;44" repeatCount="indefinite"></animate>
          <animate
            attributeName="stroke-opacity"
            dur="1000ms"
            values=".8;1;1;.4;.5;.8"
            repeatCount="indefinite"
          ></animate>
        </line>
        <line x1="52" x2="52">
          <animate attributeName="y1" dur="1000ms" values="28;18;16;16;18;28" repeatCount="indefinite"></animate>
          <animate attributeName="y2" dur="1000ms" values="36;44;48;48;46;36" repeatCount="indefinite"></animate>
          <animate
            attributeName="stroke-opacity"
            dur="1000ms"
            values=".5;.8;1;1;.4;.5"
            repeatCount="indefinite"
          ></animate>
        </line>
      </g>
    </svg>
  );
};
