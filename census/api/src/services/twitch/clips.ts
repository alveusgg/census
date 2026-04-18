import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { z } from 'zod';
import { assert } from '../../utils/assert.js';
import { useEnvironment } from '../../utils/env/env.js';
import { buildObjectUrl } from '../../utils/storage.js';
import { runLongOperation } from '../../utils/teardown.js';

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
        platform: 'web',
        slug: id
      },
      extensions: {
        persistedQuery: {
          version: 1,
          // This hash will always be the same too. Someone at twitch didn't really want
          // to secure this too much. It's a pretty easy workaround.
          sha256Hash: '4f35f1ac933d76b1da008c806cd5546a7534dfaff83e033a422a81f24e5991b3'
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
  const { storage, variables } = useEnvironment();

  return await runLongOperation(async () => {
    const key = `${id}.mp4`;

    const authentication = await authenticateAgainstClip(id);
    const highestQuality = getHighestQuality(authentication.data.clip.videoQualities);
    assert(highestQuality, 'No video qualities found');

    const url = new URL(highestQuality.sourceURL);
    url.searchParams.set('token', authentication.data.clip.playbackAccessToken.value);
    url.searchParams.set('sig', authentication.data.clip.playbackAccessToken.signature);
    const response = await fetch(url);

    await new Upload({
      client: storage,
      params: {
        Bucket: variables.S3_BUCKET,
        Key: key,
        Body: Readable.fromWeb(response.body as ReadableStream)
      }
    }).done();

    return buildObjectUrl(variables, key);
  }, 'Download clip');
};

export const TwitchChatClipResponse = z.object({
  data: z.object({
    clip: z
      .object({
        id: z.string(),
        videoOffsetSeconds: z.number().nullable().optional(),
        durationSeconds: z.number().nullable().optional(),
        video: z
          .object({
            id: z.string()
          })
          .nullable()
      })
      .nullable()
  })
});

export type TwitchChatClipResponse = z.infer<typeof TwitchChatClipResponse>;

export const getVodInfoFromClip = async (id: string) => {
  const response = await fetch(`https://gql.twitch.tv/gql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
    },
    body: JSON.stringify({
      operationName: 'ChatClip',
      variables: {
        clipSlug: id
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '9aa558e066a22227c5ef2c0a8fded3aaa57d35181ad15f63df25bff516253a90'
        }
      }
    })
  });
  const json = await response.json();
  const result = TwitchChatClipResponse.parse(json);

  return {
    videoId: result.data.clip?.video?.id ?? null,
    vodOffset: result.data.clip?.videoOffsetSeconds ?? null
  };
};
