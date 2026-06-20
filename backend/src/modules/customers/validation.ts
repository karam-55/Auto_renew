import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  fullName: Joi.string().min(2).max(200).required(),
  phone: Joi.string().pattern(/^[0-9+\-]{7,20}$/).required(),
  address: Joi.string().max(500).allow('').optional(),
  city: Joi.string().max(100).allow('').optional(),
  notes: Joi.string().max(1000).allow('').optional(),
  loyaltyPoints: Joi.number().integer().min(0).optional(),
  isVip: Joi.boolean().optional(),
});

export const updateCustomerSchema = Joi.object({
  fullName: Joi.string().min(2).max(200).optional(),
  phone: Joi.string().pattern(/^[0-9+\-]{7,20}$/).optional(),
  address: Joi.string().max(500).allow('').optional(),
  city: Joi.string().max(100).allow('').optional(),
  notes: Joi.string().max(1000).allow('').optional(),
  loyaltyPoints: Joi.number().integer().min(0).optional(),
  isVip: Joi.boolean().optional(),
});

export const addLoyaltyPointsSchema = Joi.object({
  points: Joi.number().integer().required(),
});
