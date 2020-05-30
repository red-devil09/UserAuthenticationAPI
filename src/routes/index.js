const auth = require("./auth");
const user = require("./user");

const authenticate = require("../middlewares/authenticate");

module.exports = (app) => {
  app.get("/", (req, res) => {
    res.status(200).send({
      message:
        "Welcome to the AUTHENTICATION API. Register or Login to test Authentication.",
    });
  });

  app.use("/api/auth", auth);

  //jb bhi hum user route pe jaenge usse pehle hume authentication clear krni hogi..tbhi we can proceed forward
  app.use("/api/user", authenticate, user);
};
