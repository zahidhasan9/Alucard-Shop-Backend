import {body, param} from 'express-validator';
 
const validator = {
  checkLogin: [
    body('email').trim().notEmpty().withMessage('Email is Required').bail().isEmail().withMessage("Please enter a valid email address"),
    body('password').trim().isString().notEmpty().withMessage('Password is Empty')
  ],
  checkNewUser: [
    body('email').trim().notEmpty().withMessage('Email is Required').bail().isEmail().withMessage("Please enter a valid email address"),
    body('password').trim().isString().notEmpty().withMessage('Password is Empty').bail()
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is Required').escape()
  ],
  checkGetUserById: [
    param('id').exists().withMessage('Id is required').isMongoId().withMessage('Invalid Id')
  ],
  checkUpdateUser: [
    body('email').trim().notEmpty().withMessage('Email is Required').bail().isEmail().withMessage("Please enter a valid email address"),
    body('name').trim().notEmpty().withMessage('Name is Required').escape(),
    body('isAdmin').isBoolean().withMessage('isAdmin value should be true/false'),
    param('id').exists().withMessage('Id is required').isMongoId().withMessage('Invalid Id')
  ],
  resetPasswordRequest: [
    body('email').trim().notEmpty().withMessage('Email is Required').bail().isEmail().withMessage("Please enter a valid email address")
  ],
  resetPassword: [
    body('password').trim().notEmpty().withMessage('Password is Required').escape().bail()
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    param('id').exists().withMessage('Id is required').isMongoId().withMessage('Invalid Id'),
    param('token').trim().notEmpty().withMessage('Token is Required')
  ]
}