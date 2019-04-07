const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let PollSchema = new Schema({
        url: String,
        title: String,
        options: Array, // An Array of Objects {text, img, id, votes}
        settings: Object,
        voters: Object // {sessions: String, ip: String} Holds all previous voter's session or ip
    });
    
mongoose.model('Poll', PollSchema);