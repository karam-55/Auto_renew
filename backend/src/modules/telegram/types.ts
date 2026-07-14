export interface TelegramSendMessageInput {
  chatId: string;
  message: string;
}

export interface TelegramNotificationResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface TelegramConfig {
  botToken: string;
  isEnabled: boolean;
}
