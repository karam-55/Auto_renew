import { Request, Response } from 'express';
import { DocumentService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  createDocument = async (req: AuthRequest, res: Response) => {
    try {
      const doc = await this.documentService.createDocument(req.user!.tenantId, req.body);
      res.status(201).json({ document: doc });
    } catch (error: any) {
      Logger.error('Create document error', error);
      res.status(400).json({ error: error.message || 'Failed to create document' });
    }
  };

  getDocuments = async (req: AuthRequest, res: Response) => {
    try {
      const { category, entityType, entityId } = req.query;
      const filters: any = {};
      if (category) filters.category = category;
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;
      const [documents, total] = await Promise.all([
        this.documentService.getDocuments(req.user!.tenantId, filters, skip, limit),
        this.documentService.getDocumentsCount(req.user!.tenantId, filters),
      ]);
      res.json({
        data: documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      Logger.error('Get documents error', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  };

  getCategoryCounts = async (req: AuthRequest, res: Response) => {
    try {
      const counts = await this.documentService.getCategoryCounts(req.user!.tenantId);
      res.json({ counts });
    } catch (error) {
      Logger.error('Get document counts error', error);
      res.status(500).json({ error: 'Failed to fetch document counts' });
    }
  };

  getDocumentById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await this.documentService.getDocumentById(id, req.user!.tenantId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json({ document: doc });
    } catch (error) {
      Logger.error('Get document error', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  };

  updateDocument = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await this.documentService.updateDocument(id, req.user!.tenantId, req.body);
      res.json({ document: doc });
    } catch (error: any) {
      Logger.error('Update document error', error);
      res.status(400).json({ error: error.message || 'Failed to update document' });
    }
  };

  deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.documentService.deleteDocument(id, req.user!.tenantId);
      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete document error', error);
      res.status(400).json({ error: error.message || 'Failed to delete document' });
    }
  };
}
