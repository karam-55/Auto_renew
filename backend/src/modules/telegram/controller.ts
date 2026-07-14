import { Request, Response } from 'express';
import { getTelegramService, TelegramService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class TelegramController {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = getTelegramService();
  }

  getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          enabled: this.telegramService.isEnabled(),
        },
      });
    } catch (error) {
      Logger.error('Get Telegram status error', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Telegram status',
      });
    }
  };

  sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { chatId, message } = req.body;

      if (!chatId || typeof chatId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'chatId is required and must be a string',
        });
        return;
      }

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'message is required and must be a string',
        });
        return;
      }

      const result = await this.telegramService.sendMessage(chatId, message);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      Logger.error('Send Telegram message error', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send Telegram message',
      });
    }
  };
}
