import { ContainerSASPermissions } from '@azure/storage-blob';
import { addMinutes } from 'date-fns';
import { useEnvironment } from '../../utils/env/env.js';

export const getCreateOnlySasURL = async () => {
  const { storage } = useEnvironment();
  return await storage.generateSasUrl({
    startsOn: new Date(),
    expiresOn: addMinutes(new Date(), 2),
    permissions: ContainerSASPermissions.from({ create: true })
  });
};
