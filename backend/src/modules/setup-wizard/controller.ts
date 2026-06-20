import { Request, Response } from 'express';
import { setupWizardService } from './service';
import { Logger } from '../../infrastructure/logging/logger';

export class SetupWizardController {
  /**
   * GET /api/setup-wizard/needs-init
   * Public — checks if system needs initial setup
   */
  needsInit = async (_req: Request, res: Response): Promise<void> => {
    try {
      const needsInit = await setupWizardService.needsInit();
      res.status(200).json({ success: true, data: { needsInit } });
    } catch (error) {
      Logger.error('needs-init check error', error);
      res.status(500).json({ success: false, error: 'Failed to check init status' });
    }
  };

  /**
   * POST /api/setup-wizard/init
   * Public — creates first tenant, branch, admin user
   */
  init = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await setupWizardService.init(req.body);
      res.status(200).json({ success: true, data: result, message: 'Initial setup completed' });
    } catch (error: any) {
      Logger.error('Setup wizard init error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to initialize' });
    }
  };

  /**
   * GET /api/setup-wizard/status
   */
  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || req.query.tenantId || 'default') as string;
      const status = await setupWizardService.getStatus(tenantId);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      Logger.error('Get setup wizard status error', error);
      res.status(500).json({ success: false, error: 'Failed to get setup status' });
    }
  };

  /**
   * POST /api/setup-wizard/step/1
   * Company info
   */
  saveStep1 = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      await setupWizardService.saveStep1(tenantId, req.body);
      res.status(200).json({ success: true, message: 'Company information saved' });
    } catch (error: any) {
      Logger.error('Setup wizard step 1 error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to save company info' });
    }
  };

  /**
   * POST /api/setup-wizard/step/2
   * Financial settings
   */
  saveStep2 = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      await setupWizardService.saveStep2(tenantId, req.body);
      res.status(200).json({ success: true, message: 'Financial settings saved' });
    } catch (error: any) {
      Logger.error('Setup wizard step 2 error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to save financial settings' });
    }
  };

  /**
   * POST /api/setup-wizard/step/3
   * Chart of accounts
   */
  saveStep3 = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      const result = await setupWizardService.saveStep3(tenantId, req.body);
      res.status(200).json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      Logger.error('Setup wizard step 3 error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to create chart of accounts' });
    }
  };

  /**
   * POST /api/setup-wizard/step/4
   * Asset categories
   */
  saveStep4 = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      const result = await setupWizardService.saveStep4(tenantId, req.body);
      res.status(200).json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      Logger.error('Setup wizard step 4 error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to create asset categories' });
    }
  };

  /**
   * POST /api/setup-wizard/step/5
   * Cost centers
   */
  saveStep5 = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      const result = await setupWizardService.saveStep5(tenantId, req.body);
      res.status(200).json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      Logger.error('Setup wizard step 5 error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to create cost centers' });
    }
  };

  /**
   * POST /api/setup-wizard/step/6
   * Users
   */
  saveStep6 = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      const result = await setupWizardService.saveStep6(tenantId, req.body);
      res.status(200).json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      Logger.error('Setup wizard step 6 error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to create users' });
    }
  };

  /**
   * POST /api/setup-wizard/complete
   */
  complete = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req.body.tenantId || 'default') as string;
      await setupWizardService.complete(tenantId);
      res.status(200).json({ success: true, message: 'Setup wizard completed successfully' });
    } catch (error: any) {
      Logger.error('Setup wizard complete error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to complete setup' });
    }
  };
}

export const setupWizardController = new SetupWizardController();
