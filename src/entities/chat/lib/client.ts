import { WebSocketClient } from '@/services/websocket';
import { WEBSOCKET_CONFIG } from '@/shared/config/websocket.config';

// One socket for the app's one chat session. Shared by the store (which
// drives it: connect/disconnect/send) and the bridge (which listens to it),
// so neither has to depend on the other to reach the client.
export const chatSocketClient = new WebSocketClient(WEBSOCKET_CONFIG);
