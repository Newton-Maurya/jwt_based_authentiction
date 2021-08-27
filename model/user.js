const { on } = require('events');
const mongoose = require('mongoose');
require('dotenv').config()

// creating schema
const userScgema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    emailID: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    conf_pass: {
        type: String,
        required: true
    },
    jwt_token: {
        type: String,
        required: true
    }
}
)

module.exports = mongoose.model('jwtAuth', userScgema);