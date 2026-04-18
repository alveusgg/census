import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import type { z } from 'zod';

import { config } from './env/config.js';
import { useEnvironment } from './env/env.js';

type StorageUrlConfig = Pick<
  z.infer<typeof config>,
  'S3_BUCKET' | 'S3_REGION' | 'S3_ENDPOINT' | 'S3_PUBLIC_URL'
>;

/** Public HTTPS URL for an object key (used by Mux, browsers, etc.). */
export const buildObjectUrl = (variables: StorageUrlConfig, key: string): string => {
  if (variables.S3_PUBLIC_URL) {
    return `${variables.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  if (variables.S3_ENDPOINT) {
    const base = variables.S3_ENDPOINT.replace(/\/$/, '');
    return `${base}/${variables.S3_BUCKET}/${key}`;
  }
  return `https://${variables.S3_BUCKET}.s3.${variables.S3_REGION}.amazonaws.com/${key}`;
};

export type PresignedUploadCredentials = {
  /** Presigned PUT URL */
  url: string;
  key: string;
  /** URL of the object after a successful upload */
  objectUrl: string;
};

export const getPresignedUploadURL = async (): Promise<PresignedUploadCredentials> => {
  const { storage, variables } = useEnvironment();
  const key = `${randomUUID()}.mp4`;
  const command = new PutObjectCommand({
    Bucket: variables.S3_BUCKET,
    Key: key
  });
  const url = await getSignedUrl(storage, command, { expiresIn: 120 });
  return { url, key, objectUrl: buildObjectUrl(variables, key) };
};

export const uploadFile = async (name: string, path: string) => {
  const { storage, variables } = useEnvironment();
  await storage.send(
    new PutObjectCommand({
      Bucket: variables.S3_BUCKET,
      Key: name,
      Body: createReadStream(path)
    })
  );
};
