require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
var session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const path = require("path");
var cookieParser = require("cookie-parser");
var flash = require("express-flash");

// Setting up port
const connUri = process.env.MONGO_LOCAL_CONN_URL;
let PORT = process.env.PORT || 3000;

//=== 1 - CREATE APP
// Creating express app and configuring middleware needed for authentication
const app = express();

app.use(cors());

app.use(flash());

// for parsing application/json
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "secret key",
    resave: true,
    saveUninitialized: true,
  })
);

// for parsing application/xwww-
app.use(express.urlencoded({ extended: false }));
//form-urlencoded

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

//=== 2 - SET UP DATABASE
//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;
mongoose.connect(connUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () =>
  console.log("MongoDB --  database connection established successfully!")
);
connection.on("error", (err) => {
  console.log(
    "MongoDB connection error. Please make sure MongoDB is running. " + err
  );
  process.exit();
});

//=== 3 - INITIALIZE PASSPORT MIDDLEWARE
app.use(passport.initialize());
require("./middlewares/jwt")(passport);

//=== 4 - CONFIGURE ROUTES
//Configure Route
require("./routes/index")(app);
/*
var func = require('./app/routes.js');
func(app);
*/

//=== 5 - START SERVER
app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT + "/")
);
