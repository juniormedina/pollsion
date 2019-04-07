const express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const session = require("express-session");

const app = express();

// Load Config / Models
const keys = require("./config/keys");
require("./models/Poll");

// Setup Mongoose
mongoose
  .connect(
    keys.mongodbURI,
    { useNewUrlParser: true }
  )
  .then(
    () => {
      console.log("[Server] Connected to database");
    },
    err => {
      console.log(
        "[Server] An error occurred while connecting to database"
      );
      console.log(err);
    }
  );



// Set View Engine
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Session Middleware
app.use(session({
  secret: keys.cookieSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false, maxAge: 604800000}
}));

// body-parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static Route
app.use(express.static("public"));

// Load/Set other Routes
let router = require("./routes/router");
app.use(router);

// Start Server
app.listen(keys.port, () => {
  console.log(`[Server] Listening on port ${keys.port}`);
});