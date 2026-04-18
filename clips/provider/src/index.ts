import { config } from 'dotenv';
config();

import { differenceInSeconds } from 'date-fns';
import { createEnvironment, useEnvironment, withEnvironment } from './utils/env/env';
const environment = await createEnvironment();

await withEnvironment(environment, async () => {
  const { api, mediamtx, playback, variables } = useEnvironment();

  const subscriptionHandler = api.feed.subscribeToRequestsForFeed.subscribe(
    {
      feeds: variables.FEEDS,
      key: variables.API_KEY
    },
    {
      onStarted: () => console.log('Started'),

      // This can't be an async function because trpc doesn't await it properly
      // which leads to thrown errors being swallowed.
      onData: value => {
        if (value.type === 'started') {
          console.log(`Started!`);
          return;
        }

        if (value.type === 'error') {
          console.error(value.error);
          process.exit(1);
        }

        if (value.type === 'complete') {
          // The connection is designed to be persistent, the server should
          // never drop it in normal operation but if it does, it's probably
          // because the server is shutting down.
          console.log(`Connection has been closed.`);

          // Let's trust in the docker compose running the server to restart it.
          process.exit(0);
        }

        if (value.type === 'data') {
          const { request, meta } = value;
          console.log(`Data for ${request.feedId}`, value);

          const { url: uploadUrl, objectUrl } = meta.creds;
          playback
            .recording({
              query: {
                duration: differenceInSeconds(request.endCaptureAt, request.startCaptureAt),
                start: new Date(request.startCaptureAt),
                path: request.feedId
              }
            })
            .then(async video => {
              if (video.status !== 200) throw new Error('Failed to get recording');
              const body = await video.body.arrayBuffer();
              const put = await fetch(uploadUrl, {
                method: 'PUT',
                body
              });
              if (!put.ok) {
                throw new Error(`S3 upload failed: ${put.status} ${await put.text()}`);
              }
              console.log(`Uploaded: ${objectUrl}`);

              await api.feed.completeCaptureRequest.mutate({
                captureId: request.id,
                videoUrl: objectUrl,
                key: variables.API_KEY
              });
            })
            .catch(error => {
              console.error(error);
              throw new Error('Failed to get recording');
            });

          return;
        }

        throw new Error('Not implemented');
      },
      onError: error => {
        console.error(error);
        process.exit(1);
      },
      onComplete: () => {
        // The connection is designed to be persistent, the server should
        // never drop it in normal operation but if it does, it's probably
        // because the server is shutting down.
        console.log(`Connection has been closed.`);

        // Let's trust in the docker compose running the server to restart it.
        process.exit(0);
      }
    }
  );

  const shutdownHandler = () => {
    subscriptionHandler.unsubscribe();
    process.exit(0);
  };

  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);
});
