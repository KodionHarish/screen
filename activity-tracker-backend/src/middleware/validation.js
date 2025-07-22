const { body, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants')

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST , errors.array());
  }
  next();
};

const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('designation').optional(),
  body('company').optional(),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation
};