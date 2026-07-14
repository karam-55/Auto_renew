import { Telegraf } from 'telegraf';
import { TelegramConfig, TelegramNotificationResult } from './types';
import { Logger } from '../../infrastructure/logging/logger';

export class TelegramService {
  private config: TelegramConfig;
  private bot: Telegraf | null = null;

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      isEnabled: !!process.env.TELEGRAM_BOT_TOKEN,
    };

    if (this.config.isEnabled) {
      try {
        this.bot = new Telegraf(this.config.botToken);
        this.setupHandlers();
      } catch (error) {
        Logger.error('Failed to initialize Telegram bot', error);
        this.bot = null;
        this.config.isEnabled = false;
      }
    }
  }

  private setupHandlers(): void {
    if (!this.bot) return;

    this.bot.start((ctx) => {
      const chatId = ctx.chat.id;
      ctx.reply(
        `مرحباً بك في بوت Auto Renew\n` +
        `رقم الـ Chat ID الخاص بك هو: \`${chatId}\`\n` +
        `انسخ هذا الرقم والصقه بحقل "Telegram Chat ID" داخل التطبيق.`,
        { parse_mode: 'MarkdownV2' }
      );
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(
        'الأوامر المتاحة:\n' +
        '/start - عرض رقم الـ Chat ID\n' +
        '/help - عرض هذه الرسالة'
      );
    });

    this.bot.catch((error) => {
      Logger.error('Telegram bot error', error);
    });
  }

  isEnabled(): boolean {
    return this.config.isEnabled && this.bot !== null;
  }

  async launchWebhook(path?: string): Promise<void> {
    if (!this.bot || !this.isEnabled()) return;

    if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
      await this.bot.launch({
        webhook: {
          domain: process.env.TELEGRAM_WEBHOOK_URL,
          path: path || '/telegram/webhook',
        },
      });
      Logger.info('Telegram bot launched with webhook');
    } else {
      await this.bot.launch();
      Logger.info('Telegram bot launched with long polling');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<TelegramNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Telegram bot is not enabled. Set TELEGRAM_BOT_TOKEN env variable.' };
    }

    if (!chatId || chatId.trim() === '') {
      return { success: false, error: 'Chat ID is required' };
    }

    if (!message || message.trim() === '') {
      return { success: false, error: 'Message is required' };
    }

    try {
      const response = await this.bot!.telegram.sendMessage(chatId, message);
      Logger.info(`Telegram message sent to ${chatId}`, { messageId: response.message_id });
      return { success: true, messageId: response.message_id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send Telegram message';
      Logger.error(`Telegram send message error to ${chatId}`, error);
      return { success: false, error: errorMessage };
    }
  }

  stop(): void {
    if (this.bot) {
      this.bot.stop();
      Logger.info('Telegram bot stopped');
    }
  }
}

// Singleton instance
let telegramServiceInstance: TelegramService | null = null;

export function getTelegramService(): TelegramService {
  if (!telegramServiceInstance) {
    telegramServiceInstance = new TelegramService();
  }
  return telegramServiceInstance;
}
