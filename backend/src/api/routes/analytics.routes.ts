import { Router } from 'express';
import analyticsController from '../controllers/analytics/analytics.controller';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();

// All analytics routes require view_analytics permission
router.use(requirePermission('view_analytics'));

/**
 * @route   GET /api/analytics
 * @desc    Get analytics summary/overview
 * @access  Private (requires view_analytics permission)
 */
router.get('/', analyticsController.getSummary.bind(analyticsController));

/**
 * @route   GET /api/analytics/sales
 * @desc    Get sales analytics
 * @access  Private (requires view_analytics permission)
 * @query   branchId (optional) - Filter by branch or 'all'
 * @query   dateFrom (optional) - Start date (default: 30 days ago)
 * @query   dateTo (optional) - End date (default: now)
 */
router.get('/sales', analyticsController.getSalesAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/profitability
 * @desc    Get profitability analytics
 * @access  Private (requires view_analytics permission)
 * @query   branchId (optional) - Filter by branch or 'all'
 * @query   dateFrom (optional) - Start date (default: 30 days ago)
 * @query   dateTo (optional) - End date (default: now)
 */
router.get('/profitability', analyticsController.getProfitabilityAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/bookings
 * @desc    Get booking analytics
 * @access  Private (requires view_analytics permission)
 * @query   branchId (optional) - Filter by branch or 'all'
 * @query   dateFrom (optional) - Start date (default: 30 days ago)
 * @query   dateTo (optional) - End date (default: now)
 */
router.get('/bookings', analyticsController.getBookingAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/inventory
 * @desc    Get inventory analytics
 * @access  Private (requires view_analytics permission)
 * @query   branchId (optional) - Filter by branch or 'all'
 */
router.get('/inventory', analyticsController.getInventoryAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/memberships
 * @desc    Get membership analytics
 * @access  Private (requires view_analytics permission)
 * @query   branchId (optional) - Filter by branch or 'all'
 * @query   dateFrom (optional) - Start date (default: 30 days ago)
 * @query   dateTo (optional) - End date (default: now)
 */
router.get('/memberships', analyticsController.getMembershipAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/branches
 * @desc    Get branch comparison (admin only)
 * @access  Private (requires view_analytics permission)
 * @query   dateFrom (optional) - Start date (default: 30 days ago)
 * @query   dateTo (optional) - End date (default: now)
 */
router.get('/branches', analyticsController.getBranchComparison.bind(analyticsController));

/**
 * @route   POST /api/analytics/cache/clear
 * @desc    Clear analytics cache
 * @access  Private (requires view_analytics permission)
 */
router.post('/cache/clear', analyticsController.clearCache.bind(analyticsController));

export default router;
