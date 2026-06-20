import { Request, Response } from 'express';
import { ChequeService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { CreateChequeDto, UpdateChequeDto, CreateChequeTransactionDto } from './types';

export class ChequeController {
  private chequeService: ChequeService;

  constructor(io?: any) {
    this.chequeService = new ChequeService(io);
  }

  setIo(io: any) {
    this.chequeService.setIo(io);
  }

  createCheque = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateChequeDto = req.body;

      // Handle backward compatibility - if 'amount' is provided, map it to 'amountSYP'
      if (data.amount && !data.amountSYP) {
        data.amountSYP = data.amount;
      }

      // Handle date conversions
      if (data.issueDate && typeof data.issueDate === 'string') {
        data.issueDate = new Date(data.issueDate);
      }
      if (data.dueDate && typeof data.dueDate === 'string') {
        data.dueDate = new Date(data.dueDate);
      }

      // Set default issue date if not provided
      if (!data.issueDate) {
        data.issueDate = new Date();
      }

      const cheque = await this.chequeService.createCheque(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Create cheque error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create cheque',
      });
    }
  };

  getCheques = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        chequeType: req.query.chequeType as any,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        supplierId: req.query.supplierId as string,
        invoiceId: req.query.invoiceId as string,
        bankName: req.query.bankName as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        search: req.query.search as string,
      };

      const cheques = await this.chequeService.getCheques(tenantId, filters);

      res.status(200).json({
        success: true,
        data: cheques,
      });
    } catch (error) {
      Logger.error('Get cheques error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cheques',
      });
    }
  };

  getChequeById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const cheque = await this.chequeService.getChequeById(tenantId, id);

      if (!cheque) {
        res.status(404).json({
          success: false,
          error: 'Cheque not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Get cheque by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cheque',
      });
    }
  };

  updateCheque = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateChequeDto = req.body;

      const cheque = await this.chequeService.updateCheque(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Update cheque error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cheque',
      });
    }
  };

  depositCheque = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;

      const cheque = await this.chequeService.depositCheque(tenantId, id, userId);

      res.status(200).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Deposit cheque error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deposit cheque',
      });
    }
  };

  clearCheque = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;

      const cheque = await this.chequeService.clearCheque(tenantId, id, userId);

      res.status(200).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Clear cheque error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cheque',
      });
    }
  };

  bounceCheque = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      const { notes } = req.body;

      const cheque = await this.chequeService.bounceCheque(tenantId, id, userId, notes);

      res.status(200).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Bounce cheque error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bounce cheque',
      });
    }
  };

  cancelCheque = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;

      const cheque = await this.chequeService.cancelCheque(tenantId, id, userId);

      res.status(200).json({
        success: true,
        data: cheque,
      });
    } catch (error) {
      Logger.error('Cancel cheque error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel cheque',
      });
    }
  };

  getChequesDueSoon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const cheques = await this.chequeService.getChequesDueSoon(tenantId);

      res.status(200).json({
        success: true,
        data: cheques,
      });
    } catch (error) {
      Logger.error('Get cheques due soon error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cheques due soon',
      });
    }
  };

  getOverdueCheques = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const cheques = await this.chequeService.getOverdueCheques(tenantId);

      res.status(200).json({
        success: true,
        data: cheques,
      });
    } catch (error) {
      Logger.error('Get overdue cheques error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get overdue cheques',
      });
    }
  };

  createChequeTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateChequeTransactionDto = req.body;

      const transaction = await this.chequeService.createChequeTransaction(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      Logger.error('Create cheque transaction error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create cheque transaction',
      });
    }
  };

  getChequeTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { chequeId } = req.params;

      const transactions = await this.chequeService.getChequeTransactions(tenantId, chequeId);

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      Logger.error('Get cheque transactions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cheque transactions',
      });
    }
  };

  getChequeSummaries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        chequeType: req.query.chequeType as any,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        supplierId: req.query.supplierId as string,
      };

      const summaries = await this.chequeService.getChequeSummaries(tenantId, filters);

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      Logger.error('Get cheque summaries error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cheque summaries',
      });
    }
  };
}