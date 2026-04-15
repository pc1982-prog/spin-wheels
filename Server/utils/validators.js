const { body } = require("express-validator");

const spinValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name can only contain letters, spaces, and basic punctuation"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage("Email is too long"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[+]?[\d\s\-().]{7,20}$/)
    .withMessage("Please enter a valid phone number (7-20 digits)"),

  body("sourceWebsite")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Source website URL is too long"),
];

module.exports = { spinValidators };