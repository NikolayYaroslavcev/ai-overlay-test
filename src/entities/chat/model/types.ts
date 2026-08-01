// Domain model owned by the chat entity — richer than the wire-format
// ServerMessage/ClientMessage in shared/api/types, which only describe what
// crosses the network.
export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
}
