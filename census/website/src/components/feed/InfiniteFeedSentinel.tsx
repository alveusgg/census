import { ComponentProps, FC, PropsWithChildren, useEffect, useRef } from 'react';

interface InfiniteFeedSentinelProps {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  threshold: number;
}

export const InfiniteFeedSentinel: FC<PropsWithChildren<ComponentProps<'div'> & InfiniteFeedSentinelProps>> = ({
  children,
  className,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  threshold,
  ...props
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!hasNextPage || isFetchingNextPage) return;
        void fetchNextPage();
      },
      { threshold }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold]);

  return (
    <div ref={sentinelRef} className={className} {...props}>
      {isFetchingNextPage ? children : null}
    </div>
  );
};
