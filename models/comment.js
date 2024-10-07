const mongoose = require("mongoose")
const commentSchema = new mongoose.Schema({

    text:{
        type:String,
        required:true
    },

    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    post:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post',
        required:true
    },

    liked:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    
    Count:{
        type:String,
        enum:['True','False'],
        default:'False'
    }
},
{
    timestamps:true
})

module.exports = mongoose.model('Comment' , commentSchema )