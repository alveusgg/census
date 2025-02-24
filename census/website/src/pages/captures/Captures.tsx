import { useCaptures } from '@/services/api/capture';
const regex = /-\d+x\d+/;

export const Captures = () => {
  const result = useCaptures();
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
