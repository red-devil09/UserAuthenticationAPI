const auth = require("./auth");
const user = require("./user");

const authenticate = require("../middlewares/authenticate");

module.exports = (app) => {
  app.use("/api/auth", auth);
  //jb bhi hum user route pe jaenge usse pehle hume authentication clear krni hogi..tbhi we can proceed forward
  app.use("/api/user", authenticate, user);
};
