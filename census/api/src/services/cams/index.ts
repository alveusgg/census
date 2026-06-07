import { DownstreamError } from '@alveusgg/error';
import * as Sentry from '@sentry/node';
import { differenceInSeconds } from 'date-fns';
import { getPresignedUploadURL, PresignedUploadCredentials } from '../../utils/storage.js';
import { AlveusAuthenticationMethodsProvider } from '../auth/methods/alveus.js';

const CAM_MANAGER_HOST = 'cams-manager.frobert.workers.dev';
const CAM_MANAGER_PATH = 'garden';

export const requestClipFromCamManager = async (startDate: Date, endDate: Date, captureId?: number) => {
  const token = await AlveusAuthenticationMethodsProvider.acquireClientTokenForRoles(['ptzControl']);
  const duration = differenceInSeconds(endDate, startDate);
  const uploadInfo = await getPresignedUploadURL();

  const highQualityClip = await requestClip(CAM_MANAGER_PATH, token, startDate, duration, uploadInfo, captureId);
  return highQualityClip;
};

const requestClip = async (
  path: string,
  token: string,
  startDate: Date,
  duration: number,
  uploadInfo: PresignedUploadCredentials,
  captureId?: number
) => {
  const url = `https://${CAM_MANAGER_HOST}/api/clips/${path}/clip`;
  const response = await Sentry.startSpan(
    {
      name: `POST ${url}`,
      op: 'http.client',
      attributes: {
        'http.method': 'POST',
        'url.full': url,
        'server.address': CAM_MANAGER_HOST,
        'capture.duration_seconds': duration,
        'cam_manager.path': path
      }
    },
    async span => {
      if (captureId !== undefined) span.setAttribute('capture.id', captureId);

      const response = await fetch(url, {
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

      span.setAttributes({
        'http.response.status_code': response.status,
        'http.response.ok': response.ok
      });
      span.setStatus({ code: response.ok ? 1 : 2, message: response.ok ? 'ok' : 'downstream_error' });

      return response;
    }
  );

  if (!response.ok) {
    throw new DownstreamError('cams-manager', `Failed to request clip: ${response.status} ${await response.text()}`);
  }

  return uploadInfo.objectUrl;
};
