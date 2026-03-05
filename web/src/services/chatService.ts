import api from './api';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageResponse {
  response: string;
  conversation_history: ConversationMessage[];
}

const chatService = {
  async sendMessage(
    message: string,
    conversationHistory: ConversationMessage[]
  ): Promise<ChatMessageResponse> {
    // 90s timeout — agent may run multiple tool-call rounds before responding
    const response = await api.post<ChatMessageResponse>(
      '/chat/message',
      { message, conversation_history: conversationHistory },
      { timeout: 90000 }
    );
    return response.data;
  },
};

export default chatService;
