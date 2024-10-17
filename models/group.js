const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],

    isGroup: {
        type: Boolean,
        default: false,
    },

    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    photo: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/9790/9790561.png',
      },

},{
    timestamps:true
})

module.exports = mongoose.model('Group' , groupSchema)