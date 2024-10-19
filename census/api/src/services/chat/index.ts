import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { useEnvironment } from '../../utils/env/env.js';
import { getPermissions } from '../auth/role.js';
import { createCaptureRequest } from '../snapshot/index.js';
import { restoreToken, saveToken } from './auth/token.js';
interface Status {
  status: 'pending' | 'offline:not_authenticated' | 'offline' | 'online';
  channels: string[];
  commands: string[];
}

const handler: Record<string, (chat: ChatClient, channel: string, user: string, message: string) => Promise<void>> = {
  capture: async (chat: ChatClient, channel: string, user: string) => {
    const env = useEnvironment();
    const permissions = await getPermissions(user);

    if (!permissions.editor) {
      return;
    }

    const request = await createCaptureRequest('twitch', user, 30, 30);
    chat.say(channel, `@${user} Critter captured! ${env.variables.UI_URL}/s/${request.id}`);
  }
};

export const status: Status = {
  status: 'pending',
  channels: [],
  commands: Object.keys(handler)
};

export const start = async () => {
  const env = useEnvironment();

  const token = await restoreToken();
  if (!token) {
    status.status = 'offline:not_authenticated';
    return;
  }

  const auth = new RefreshingAuthProvider({
    clientId: env.variables.TWITCH_CLIENT_ID,
    clientSecret: env.variables.TWITCH_CLIENT_SECRET
  });

  auth.onRefresh((_, token) => saveToken(token));
  await auth.addUserForToken(token, ['chat']);

  const chat = new ChatClient({ authProvider: auth, channels: env.variables.CHANNELS_TO_LISTEN_TO });
  status.channels = env.variables.CHANNELS_TO_LISTEN_TO;
  chat.onConnect(() => (status.status = 'online'));

  chat.onDisconnect(() => (status.status = 'offline'));

  chat.connect();

  chat.onMessage(async (channel, user, message) => {
    const env = useEnvironment();
    if (!message.startsWith(env.variables.COMMAND_PREFIX)) return;

    for (const command of status.commands) {
      if (message.startsWith(`${env.variables.COMMAND_PREFIX}${command}`)) {
        await handler[command](chat, channel, user, message);
      }
    }
  });
};
