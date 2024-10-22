const mongoose  = require("mongoose")
const messageSchema = new mongoose.Schema({

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
   
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },

    GroupId:{
     type:mongoose.Schema.Types.ObjectId,
     ref:'Group'
    },

    message:{
        type:String
    },

    image: {
        type: [mongoose.Schema.Types.Mixed],  // Store images as an array
        required: false
    },
    videos:{
        type: [mongoose.Schema.Types.Mixed],  // Store images as an array
        required: false
    },
    
    GIF_URL:{
        type: [mongoose.Schema.Types.Mixed],  // Store images as an array
        required: false
    }

},
{
    timestamps:true
}
)

module.exports = mongoose.model('Message' , messageSchema)