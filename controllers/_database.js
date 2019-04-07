const mongoose = require('mongoose');

//Connect to database
let connection = mongoose.createConnection('mongodb://localhost/my_db');

// Load Schemas
let pollSchema = require('../models/pollSchema');
let Poll = mongoose.model('Poll', pollSchema);

// Checks if a URL exists and returns a promise
let find = function(url){
    return Poll.countDocuments({url: url}).exec();
}

// Creates a Poll and stores it into the database
let create = function(data) {
    
    function attempt(resolve, reject, counter = 0){
        let url = generateURL();
        find(url)
        .then(function(result){
            if(result == 0){
                // Url is unique; Create document in database
                let poll = {
                    url: url, 
                    title: data.title, 
                    options: data.options, 
                    votes: generateVotes(data.options), 
                    addons: data.addons
                };
                Poll.create(poll)
                    .then(() => {
                        // Document successfully created
                        resolve(poll);
                    })
                    .catch(() => {
                        // Problem creating document
                        reject();
                    });
            }else{
                counter++;
                //Max of 5 attempts
                if(counter < 5) {
                    attempt(resolve, reject, counter);
                }else{
                    // Send error/timeout response to client
                    //errorResponse("There seems to be an issue with our database, please try again later.");
                    reject();
                }       
            }
        })
        .catch(function(err){
            // There has been a database error
            //errorResponse("There seems to be an issue with our database, please try again later.");
            reject();
        });
    }
    return new Promise(attempt);
}

let get = function(url){
    return Poll.findOne({url: url}).exec();
}

// Deletes a Poll from the database
let dbDelete = function() {

}

let vote = function(url, selection){

    function attempt(resolve, reject){
        // Check if url exists in db and add a vote to the selected option's counter array
        find(url)
        .then(result => {
            switch(result){
                case 0:
                    // Url not found
                    reject("url not found");
                break;

                case 1:
                    // Url found
                    get(url)
                        .then(poll => {
                            // Check if selection exists
                            if(selection < poll.options.length){
                                // Add 1 to the current vote count for the selection
                                let updatedVotes = poll.votes.slice();
                                updatedVotes[selection] ++;
                                
                                poll.set({votes: updatedVotes});
                                poll.save();
                                
                                resolve();
                            }else{
                                // Option does not exist
                                reject("Option does not exist");
                            }
                        })
                        .catch(() => {
                            reject("Error returning poll from database")
                        });
                break;

                default:
                    // Mutiple db entries found. Database error
                    reject("Mutiple db entries found. Database error");
            }
        })
        .catch(err => {
            reject(`Database error: ${err}`);
        });
    }
    return new Promise(attempt);
}

// Generates a random (5) letter URL
let generateURL = function(){
    let urlLength = 5;
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }
    let urlArray = [];
    // Add 5 random letters to the array
    for(let i = 0; i < urlLength; i++){
        let letterCase = randomInt(0, 1); // 0: uppercase || 1: lowercase
        if(letterCase == 0){
            urlArray.push(String.fromCharCode(randomInt(65, 90)));
        }else{
            urlArray.push(String.fromCharCode(randomInt(97, 122)));
        }
    }
    return urlArray.join('');
}

// Generates an array of 0s for the amount of options
let generateVotes = function(options){
    let votes = [];
    for(let i = 0; i < options.length; i++){
        votes.push(0);
    }
    return votes;
}

let public = {
    create: create,
    get: get,
    vote: vote
}







module.exports = public;