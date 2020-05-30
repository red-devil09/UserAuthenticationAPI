const express = require("express");
const { check } = require("express-validator");

const Auth = require("../controllers/auth");
const Password = require("../controllers/password");
const validate = require("../middlewares/validate");

const router = express.Router();

//isse pehle index.js mei jaake dekho..if hume /api/auth kia hoga to hum yaha ayenge

//127.0.0.1:3000/api/auth   "GET" -> for below code to run
router.get("/", (req, res) => {
  res.status(200).json({
    message:
      "You are in the Auth Endpoint. Register or Login to test Authentication.",
  });
});

//127.0.0.1:3000/api/auth/register  "POST"  -> for below code to run
router.post(
  "/register",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password")
      .not()
      .isEmpty()
      .isLength({ min: 6 })
      .withMessage("Must be at least 6 chars long"),
    check("firstName")
      .not()
      .isEmpty()
      .withMessage("You first name is required"),
    check("lastName").not().isEmpty().withMessage("You last name is required"),
  ],
  validate,
  Auth.register
);

//127.0.0.1:3000/api/auth/login  "POST"  -> for below code to run
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password").not().isEmpty(),
  ],
  validate,
  Auth.login
);

//EMAIL Verification

//http://127.0.0.1:3000/api/auth/verify/d12d5843e6f1f1496e453115c0c12fbef3ff416a
// register krke apne aap jo email pe link jata hai..vo yahi hai and last wala part token id hai
router.get("/verify/:token", Auth.verify);
router.post("/resend", Auth.resendToken);

//Password RESET
//127.0.0.1:3000/api/auth/recover  "POST"  -> for below code to run
//isse given mail pe reset password ka link ayega
router.post(
  "/recover",
  [check("email").isEmail().withMessage("Enter a valid email address")],
  validate,
  Password.recover
);

//ye jb email pe link ayega to link ko click krne pe yahi url khulega..as khol rhe hai to get
router.get("/reset/:token", Password.reset);

//jb change password pe click krenge to "POST" request hogi
router.post(
  "/reset/:token",
  [
    check("password")
      .not()
      .isEmpty()
      .isLength({ min: 6 })
      .withMessage("Must be at least 6 chars long"),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  validate,
  Password.resetPassword
);

module.exports = router;
