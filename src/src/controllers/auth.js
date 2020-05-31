const User = require("../models/user");
const Token = require("../models/token");
const { sendEmail } = require("../utils/index");

// @route POST api/auth/register
// @desc Register user
// @access Public
exports.register = async (req, res) => {
  try {
    const { email } = req.body;

    // Make sure this account doesn't already exist
    const user = await User.findOne({ email });

    if (user) {
      req.flash(
        "error",
        "The email address you have entered is already associated with another account."
      );
      return res.redirect("/api/auth/register");
    }

    const newUser = new User({ ...req.body, role: "basic" });

    const user_ = await newUser.save();

    await sendVerificationEmail(user_, req, res);
  } catch (error) {
    req.flash("error", `${JSON.stringify(error)}`);
    return res.redirect("/api/auth/register");
    /*res.status(500).json({ success: false, message: error.message });*/
  }
};

// @route POST api/auth/login
// @desc Login user and return JWT token
// @access Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "User doesn't exist.Please register first");
      return res.status(401).redirect("/api/auth/register");
    }

    //validate password
    if (!user.comparePassword(password)) {
      req.flash("error", "Invalid email or password");
      return res.status(401).redirect("/api/auth/login");
    }

    // Make sure the user has been verified
    if (!user.isVerified) {
      req.flash("error", "please verify your email first");
      return res.status(401).redirect("/api/auth/login");
    }

    // Login successful, write token, and send back user
    res.status(200).json({ token: user.generateJWT(), user: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===EMAIL VERIFICATION
// @route GET api/verify/:token
// @desc Verify token
// @access Public
exports.verify = async (req, res) => {
  if (!req.params.token) {
    req.flash("error", "We were unable to find a user for this token.");
    return res.status(400).redirect("back");
  }

  try {
    // Find a matching token
    const token = await Token.findOne({ token: req.params.token });

    if (!token) {
      req.flash(
        "error",
        "We were unable to find a valid token. Your token my have expired."
      );
      return res.status(400).redirect("back");
    }

    // If we found a token, find a matching user
    User.findOne({ _id: token.userId }, (err, user) => {
      if (!user) {
        req.flash("error", "We were unable to find a user for this token.");
        return res.status(400).redirect("back");
      }

      if (user.isVerified) {
        req.flash("error", "This user has already been verified..");
        return res.status(400).redirect("back");
      }

      // Verify and save the user
      user.isVerified = true;
      user.save(function (err) {
        if (err) return res.status(500).json({ message: err.message });

        req.flash("info", "Account has been verified.Please log in");
        return res.status(200).redirect("/api/auth/login");
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST api/resend
// @desc Resend Verification Token
// @access Public
exports.resendToken = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      {
        req.flash(
          "error",
          "The email address " +
            req.body.email +
            " is not associated with any account. Double-check your email address and try again."
        );
        return res.redirect("/api/auth/resend");
      }
    }

    if (user.isVerified) {
      req.flash(
        "info",
        "This account has already been verified. Please log in."
      );
      return res.redirect("/api/auth/login");
    }

    await sendVerificationEmail(user, req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function sendVerificationEmail(user, req, res) {
  try {
    const token = user.generateVerificationToken();

    // Save the verification token
    await token.save();

    let subject = "Account Verification Token";
    let to = user.email;
    let from = process.env.FROM_EMAIL;
    let link = "http://" + req.headers.host + "/api/auth/verify/" + token.token;
    let html = `<p>Hi ${user.username}<p><br><p>Please click on the following <a href="${link}">link</a> to verify your account.</p> 
                  <br><p>If you did not request this, please ignore this email.</p>`;

    await sendEmail({ to, from, subject, html });
    req.flash(
      "info",
      "A verification email has been sent to " +
        user.email +
        ".Kindly verify your Email."
    );
    return res.redirect("/api/auth/register");
  } catch (error) {
    res.status(500).json({ message: error });
  }
}
