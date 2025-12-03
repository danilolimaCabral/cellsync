import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import AsyncStorageService from '../storage/AsyncStorageService';
import { API_CONFIG } from '../../utils/constants';
import type { AppRouter } from '../../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: API_CONFIG.TRPC_URL,
        async headers() {
          const token = await AsyncStorageService.getAuthToken();
          return {
            authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          };
        },
      }),
    ],
    transformer: superjson,
  });
};
