import { DownstreamError } from '@alveusgg/error';
import { differenceInSeconds } from 'date-fns';
import { getPresignedUploadURL, PresignedUploadCredentials } from '../../utils/storage.js';
import { AlveusAuthenticationMethodsProvider } from '../auth/methods/alveus.js';

export const requestClipFromCamManager = async (startDate: Date, endDate: Date) => {
  const token = await AlveusAuthenticationMethodsProvider.acquireClientTokenForRoles(['ptzControl']);
  const duration = differenceInSeconds(endDate, startDate);
  const uploadInfo = await getPresignedUploadURL();

  const highQualityClip = await requestClip('garden', token, startDate, duration, uploadInfo);
  return highQualityClip;
};

const requestClip = async (
  path: string,
  token: string,
  startDate: Date,
  duration: number,
  uploadInfo: PresignedUploadCredentials
) => {
  const response = await fetch(`https://cams-manager.frobert.workers.dev/api/clips/${path}/clip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      startDate,
      duration,
      uploadInfo: {
        type: 's3',
        signedUrl: uploadInfo.url
      }
    })
  });

  if (!response.ok) {
    throw new DownstreamError('cams-manager', `Failed to request clip: ${response.status} ${await response.text()}`);
  }

  return uploadInfo.objectUrl;
};
