import { randomUUID } from 'crypto';
import { useEnvironment } from '../../utils/env/env';
import { TemporaryFile } from '../../utils/tmp';
import { runTwitchDownloader } from './utils';

export const downloadClip = async (id: string) => {
  const { storage } = useEnvironment();
  const file = await TemporaryFile.create(`${id}-${randomUUID()}.mp4`, 5 * 60, async file => {
    await runTwitchDownloader(['clipdownload', '--id', id, '--output', file.path]);
  });

  const client = storage.getBlockBlobClient(file.name);
  await client.uploadFile(file.path);
  return client.url;
};
