import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { z } from 'zod';
import { useEnvironment } from '../../utils/env/env';

const VideoQualities = z.object({
  frameRate: z.number(),
  quality: z.enum(['1080', '720', '480', '360']),
  sourceURL: z.string()
});

type VideoQuality = z.infer<typeof VideoQualities>;

const TwitchClipAuthenticationResult = z.object({
  data: z.object({
    clip: z.object({
      id: z.string(),
      playbackAccessToken: z.object({
        signature: z.string(),
        value: z.string()
      }),
      videoQualities: z.array(VideoQualities)
    })
  })
});

export const authenticateAgainstClip = async (id: string) => {
  // There was a recent change that now requires some kind of authentication
  // for viewing, and therefore, downloading clips. This authentication is
  // the weakest possible implementation so it seems like no one really
  // cares about it.
  const response = await fetch(`https://gql.twitch.tv/gql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // This is NOT the census client ID. This is the official twitch UI client ID.
      // This is required to authenticate against this request.
      'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
    },
    body: JSON.stringify({
      operationName: 'VideoAccessToken_Clip',
      variables: {
        slug: id
      },
      extensions: {
        persistedQuery: {
          version: 1,
          // This hash will always be the same too. Someone at twitch didn't really want
          // to secure this too much. It's a pretty easy workaround.
          sha256Hash: '36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11'
        }
      }
    })
  });

  const json = await response.json();
  return TwitchClipAuthenticationResult.parse(json);
};

const getHighestQuality = (videoQualities: VideoQuality[]) => {
  const sorted = videoQualities.sort((a, b) => b.quality.localeCompare(a.quality));
  return sorted.at(0);
};

export const downloadClip = async (id: string) => {
  const { storage } = useEnvironment();
  const client = storage.getBlockBlobClient(`${id}.mp4`);

  const authentication = await authenticateAgainstClip(id);
  const highestQuality = getHighestQuality(authentication.data.clip.videoQualities);
  if (!highestQuality) throw new Error('No video qualities found');

  const url = new URL(highestQuality.sourceURL);
  url.searchParams.set('token', authentication.data.clip.playbackAccessToken.value);
  url.searchParams.set('sig', authentication.data.clip.playbackAccessToken.signature);
  const response = await fetch(url);

  await client.uploadStream(Readable.fromWeb(response.body as ReadableStream));
  return client.url;
};
