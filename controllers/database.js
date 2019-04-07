const mongoose = require("mongoose");
const Poll = mongoose.model("Poll");

// Creates
function create(data) {
  let attempt = (resolve, reject, counter = 0) => {
    // Generate URL for Poll
    let url = generateURL();
    // Check if URL already exists in database
    count(url)
      .then(result => {
        if (result == 0) {
          // URL is unique; Create document and store into database
          initOptions(data.options);
          let poll = {
            url: url,
            title: data.title,
            options: data.options,
            settings: data.settings,
            voters: { sessions: [], addresses: [] }
          };
          new Poll(poll)
            .save()
            .then(() => {
              // Poll successfully created
              resolve(poll);
            })
            .catch(err => {
              // Handle error | Error saving to database | Database Timeout
              console.log("[MongoDB] Error saving to database");
              console.log(err);
              reject();
            });
        } else {
          // URL already exists
          // Check counter against the max {5}
          counter++;
          if (counter > 5) {
            // Handle error | Timeout response to client
            console.log("[MongoDB] Error generating unique URL");
            reject();
          } else {
            // Attempt Poll creation again
            attempt(resolve, reject, counter);
          }
        }
      })
      .catch(err => {
        // Handle error | Timeout from database query
        console.log("[MongoDB] Error querying database");
        reject();
      });
  };

  return new Promise(attempt);
}

// Returns a Poll if any found with url
function get(session, ip, url) {
  return new Promise((resolve, reject) => {
    Poll.findOne({ url: url }, { _id: 0 })
      .then(poll => {
        if (poll != null) {
          poll.allowedToVote = true;
          if (poll.settings.uniqueIP) {
            // Checks if ip exists in addresses array
            if (poll.voters.addresses.includes(ip)) {
              // Client IP Address has already voted
              poll.allowedToVote = false;
            }
          } else {
            // Checks if session exists in sessions array
            if (poll.voters.sessions.includes(session)) {
              // Client session has already voted
              poll.allowedToVote = false;
            }
          }
          resolve(poll);
        } else {
          reject("Poll doesn't exist");
        }
      })
      .catch(err => {
        console.log(err);
        reject("Error finding poll");
      })
  });
}

// Attempts to cast a vote
function vote(session, ip, url, option) {
  return new Promise((resolve, reject) => {
    // Tries to find a poll with the url passed
    Poll.findOne({ url: url }).then(poll => {
      // Checks if poll returned is valid
      if (poll != null) {
        // Attempts to find the option
        let foundOption = null;
        for (let i = 0; i < poll.options.length; i++) {
          if (poll.options[i].id == option) foundOption = i;
        }
        // Checks if option was found
        if (foundOption != null) {
          // Updates the vote count for the option
          let updatedOption = {
            text: poll.options[foundOption].text,
            img: poll.options[foundOption].img,
            id: poll.options[foundOption].id,
            votes: poll.options[foundOption].votes + 1
          };
          poll.options.set(foundOption, updatedOption);
          // Updates the voters for the poll
          let updatedVoters = {
            sessions: poll.voters.sessions.splice(),
            addresses: poll.voters.addresses.splice()
          };
          // Stores the ip address if uniqueIP option was enabled for poll
          if (poll.settings.uniqueIP) updatedVoters.addresses.push(ip);
          // Stores the session id
          updatedVoters.sessions.push(session);
          poll.voters = updatedVoters;
          // Attempts to save the changes to the poll
          poll
            .save()
            .then(() => {
              // Changes were successful
              resolve(poll);
            })
            .catch(() => {
              // Error saving changes
              reject("Database error");
            });
        } else {
          // Option was not found
          reject("Option doesn't exist");
        }
      } else {
        // Poll was not found
        reject("Poll doesn't exist");
      }
    });
  });
}

// Helpers --------------------------------------------------------------------------

// Used to find a unique url within the database
function count(url) {
  return Poll.countDocuments({ url: url }).exec();
}

// Generates a random (5) letter URL
function generateURL() {
  let urlLength = 5;
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  let urlArray = [];
  // Add 5 random letters to the array
  for (let i = 0; i < urlLength; i++) {
    let letterCase = randomInt(0, 1); // 0: uppercase || 1: lowercase
    if (letterCase == 0) {
      urlArray.push(String.fromCharCode(randomInt(65, 90)));
    } else {
      urlArray.push(String.fromCharCode(randomInt(97, 122)));
    }
  }
  return urlArray.join("");
}

// Assign ids and init votes property for each option
function initOptions(options) {
  for (let i = 0; i < options.length; i++) {
    options[i].id = i;
    options[i].votes = 0;
  }
}

module.exports = {
  create: create,
  get: get,
  vote: vote
};
