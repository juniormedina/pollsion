const express = require("express");
const router = express.Router();
const database = require("../controllers/database");
const hb = require("express-handlebars").create();

// Session management
router.use((req, res, next) => {
  req.session.ip = (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  ).split(",")[0];
  if (req.session.visits) req.session.visits++;
  else req.session.visits = 1;
  next();
});

// Index
router.get("/", (req, res) => {
  console.log(req.session.visits);
  res.render("index");
});

router.get("/:url", (req, res, next) => {
  let url = req.params.url;
  if(url.length > 0) res.redirect(`/v/${req.params.url}`);
  else next();
});

// Poll
router.get("/v/:url", (req, res) => {
  let url = req.params.url;
  // Send Poll request to database
  database
    .get(req.session.id, req.session.ip, url)
    .then(poll => {
      // Checks if client has already voted
      if (poll.allowedToVote) {
        // Client hasn't voted; Renders Poll
        res.render("partials/_poll", poll);
      } else {
        // Client has already voted; Renders results page with message
        poll.error = "You already voted!";
        res.render("partials/_results", poll);
      }
    })
    .catch(error => {
      // Poll doesn't exist
      console.log("That Pollsion doesn't exists")
      res.render('index', {error: "That Pollsion doesn't exist!"})
    });
});

// Results
router.get("/r/:url", (req, res) => {
  let url = req.params.url;
  // Send Poll request to database
  database
    .get(req.session.id, req.session.ip, url)
    .then(poll => {
      res.render("partials/_results", poll);
    })
    .catch(error => {
      // TODO: Add Error message as flash message
      res.redirect("/");
    });
});

// Poll Creation
router.post("/create", (req, res) => {
  // Validate data
  let data = req.body;

  // Send data to database controller
  database
    .create(data)
    .then(poll => {
      console.log(poll);
      // Render Poll html
      poll.created = true;
      hb.render("views/partials/_poll.handlebars", poll)
        .then(renderedHtml => {
          // Send Poll to client
          res.json({
            renderedHtml: renderedHtml
          });
        })
        .catch(err => {
          // Notify client about error
          res.send("There seems to be an error, please try again later.");
          console.log("Error rendering Poll into String");
          console.log(err);
        });
    })
    .catch(() => {
      // Notify client about error
      res.send("There seems to be an error, please try again later.");
      console.log("Error creating Poll in database");
    });
});

router.post("/vote", (req, res) => {
  let data = req.body;
  console.log(req.sessionID);
  database
    .vote(req.session.id, req.session.ip, data.url, data.option)
    .then(poll => {
      poll.success = "Your vote has been counted!"
      // Render Poll html
      hb.render("views/partials/_results.handlebars", poll)
        .then(renderedHtml => {
          // Send Poll to client
          res.json({
            renderedHtml: renderedHtml
          });
        })
        .catch(err => {
          // Notify client about error
          req.localStorage.error = "That Pollsion doesn't exist!";
          res.redirect("/");
          console.log("Error rendering Poll into String");
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
      // TODO: Ajax error handle
      res.render('index', {error: "That Pollsion doesn't exist!"})
    });
  console.log(`Received a vote for ${data.option} @${data.url}`);
});

router.post("/results", (req, res) => {
  let url = req.body.url;
  // Send Poll request to database
  database
    .get(req.session.id, req.session.ip, url)
    .then(poll => {
      // Render Poll html
      hb.render("views/partials/_results.handlebars", poll)
        .then(renderedHtml => {
          // Send Poll to client
          res.json({
            renderedHtml: renderedHtml
          });
        })
        .catch(err => {
          // Notify client about error
          res.redirect("/");
          console.log("Error rendering Poll into String");
          console.log(err);
        });
    })
    .catch(error => {
      // TODO: Add Error message as flash message
      res.redirect("/");
    });
});

router.post("/votepage", (req, res) => {
  let url = req.body.url;
  // Send Poll request to database
  database
    .get(req.session.id, req.session.ip, url)
    .then(poll => {
      // Checks if client has already voted
      if (poll.allowedToVote) {
        // Client hasn't voted; Renders Poll html
        hb.render("views/partials/_poll.handlebars", poll)
          .then(renderedHtml => {
            // Send Poll to client
            res.json({
              renderedHtml: renderedHtml
            });
          })
          .catch(err => {
            // Notify client about error
            res.redirect("/");
            console.log("Error rendering Poll into String");
            console.log(err);
          });
      } else {
        // Client has already voted; Renders results page with message
        poll.error = "You have voted already!";
        res.render("partials/_results", poll);
      }
    })
    .catch(error => {
      // TODO: Add Error message as flash message
      res.redirect("/");
    });
});
module.exports = router;
