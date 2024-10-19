export const getIconForFamily = (family: string) => {
  switch (family) {
    case 'Plantae':
      return (
        <svg className="max-w-4 min-w-4" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.3853 9.3189C9.15425 7.82054 7.42345 6.16474 6.19315 5.02195C6.11598 4.94286 6.07776 4.86451 6.07776 4.74624C6.07776 4.5097 6.23137 4.35225 6.46214 4.35225C6.5393 4.35225 6.65469 4.39143 6.73113 4.43135H6.76935C8.50015 6.04798 9.8848 7.4273 10.8851 8.61002C10.9622 8.45257 11.0387 8.29438 11.1158 8.13693C11.1158 8.13693 11.1158 8.09776 11.1541 8.05784C11.1923 7.93957 11.2312 7.78212 11.2694 7.66385C11.2694 7.62468 11.3077 7.58476 11.3077 7.54558C11.3459 7.42731 11.3459 7.30904 11.3848 7.19077C11.3848 7.15159 11.3848 7.11167 11.4231 7.03332C11.3848 6.87439 11.3848 6.67703 11.3848 6.51959C11.3848 3.44453 8.23117 1.8279 5.23111 1.78873C2.50003 1.74955 1 1 1 1C1 1 1.38438 5.02123 2.19209 7.26839C3.1159 9.83119 4.80777 10.8565 7.15447 10.8565C7.30808 10.8565 7.46241 10.8565 7.61602 10.8173H7.65424C7.76963 10.8173 7.92323 10.7781 8.03862 10.7382H8.07684C8.34583 10.6591 8.61556 10.5807 8.88455 10.4625C9.11532 10.3442 9.3461 10.2259 9.57687 10.0685C10.3464 10.9755 10.8461 11.6851 10.8461 12H12C11.9618 11.4079 11.3084 10.3833 10.3853 9.3189Z"
            fill="currentColor"
          />
        </svg>
      );

    case 'Insecta':
      return (
        <svg
          className="max-w-4 min-w-4 peer-hover:text-red-600"
          viewBox="0 0 13 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.94645 11.8186L5.09998 12.3341C5.18381 12.5987 5.33679 12.8219 5.56 12.9891C5.76905 13.1426 6.03363 13.24 6.31237 13.24C6.86984 13.24 7.35763 12.8774 7.52476 12.3341L7.67828 11.8186C7.1905 11.2611 6.71687 10.634 6.31237 9.97906C5.92202 10.634 5.43424 11.2611 4.94645 11.8186Z"
            fill="currentColor"
          />
          <path
            d="M4.26383 0.961472C4.5284 0.961472 4.96067 1.64415 5.10003 2.78747C4.68193 3.13589 4.43096 3.6792 4.50064 4.26505L4.5284 4.52963H8.06807L8.09584 4.26505C8.16552 3.67982 7.92871 3.12234 7.49644 2.78747C7.63581 1.63061 8.08168 0.961472 8.33265 0.961472C8.59723 0.961472 8.80628 0.75242 8.80628 0.487844C8.80628 0.223267 8.59723 0.0142155 8.33265 0.0142155C7.58029 0.0142155 6.81382 0.850423 6.57634 2.43894H6.46473H6.11631H6.00471C5.78258 0.836208 5.01606 0 4.26373 0C3.99915 0 3.7901 0.209052 3.7901 0.473628C3.78955 0.738748 3.99871 0.961472 4.26383 0.961472Z"
            fill="currentColor"
          />
          <path
            d="M9.65723 7.16325C9.29465 6.15992 8.90486 5.56052 8.50036 5.22632H6.66084V9.18409C7.32992 10.4384 8.43068 11.665 9.16947 12.4173C9.49012 12.7379 10.0334 12.5425 10.0612 12.0966C10.1592 10.8151 10.2147 8.66843 9.65723 7.16325Z"
            fill="currentColor"
          />
          <path
            d="M5.96397 5.22632H4.11024C3.7063 5.56058 3.31596 6.15997 2.95338 7.16325C2.41006 8.65435 2.46559 10.8146 2.56303 12.0966C2.5908 12.5425 3.13467 12.7379 3.45477 12.4173C4.19353 11.6649 5.29428 10.4242 5.96339 9.18406L5.96397 5.22632Z"
            fill="currentColor"
          />
        </svg>
      );
  }
};
