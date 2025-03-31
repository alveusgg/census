import { useCaptures } from '@/services/api/capture';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
const regex = /-\d+x\d+/;

export const Captures = () => {
  const query = useCaptures();
  const result = useSuspenseInfiniteQuery(query);
  return (
    <div>
      {result.data.pages.flatMap(page => {
        return page.data.map(capture => {
          return (
            <div key={capture.id}>
              <pre>{capture.startCaptureAt.toISOString()}</pre>
              <img src={capture.clipMetadata?.thumbnail?.replace(regex, '')} />
            </div>
          );
        });
      })}
    </div>
  );
};
