const User = require("../models/user");
const { sendEmail } = require("../utils/index");

// @route POST api/auth/recover
// @desc Recover Password - Generates token and Sends password reset email
// @access Public
exports.recover = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      req.flash(
        "error",
        "The email address " +
          req.body.email +
          " is not associated with any account. Double-check your email address and try again."
      );
      return res.redirect("/api/auth/recover");
    }

    //Generate and set password reset token
    user.generatePasswordReset();

    // Save the updated user object
    await user.save();

    // send email
    let subject = "Password change request";
    let to = user.email;
    let from = process.env.FROM_EMAIL;
    let link =
      "http://" +
      req.headers.host +
      "/api/auth/reset/" +
      user.resetPasswordToken;
    let html = `<p>Hi ${user.username}</p>
                    <p>Please click on the following <a href="${link}">link</a> to reset your password.</p> 
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;

    await sendEmail({ to, from, subject, html });
    req.flash(
      "info",
      "The Email has been sent to " +
        req.body.email +
        ". Kindly reset your password from there"
    );
    return res.redirect("/api/auth/recover");
  } catch (error) {
    req.flash("error", "There is some server side error");
    return res.redirect("/api/auth/recover");
  }
};

// @route POST api/auth/reset
// @desc Reset Password - Validate password reset token and shows the password reset view
// @access Public
exports.reset = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/api/auth/recover");
    }

    //Redirect user to form with the email address
    res.render("reset", {
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST api/auth/reset
// @desc Reset Password
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.status(401).redirect("/api/auth/recover");
    }

    //Set the new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.isVerified = true;

    // Save the updated user object
    await user.save();

    let subject = "Your password has been changed";
    let to = user.email;
    let from = process.env.FROM_EMAIL;
    let html = `<p>Hi ${user.username}</p>
                    <p>This is a confirmation that the password for your account ${user.email} has just been changed.</p>`;

    await sendEmail({ to, from, subject, html });

    req.flash("success", "Your password han been updated");
    return res.redirect("/api/auth/login");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
