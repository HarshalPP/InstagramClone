const Group = require("../models/group")


// Create the Group //

// exports.creategroup = async(req,res)=>{
//     try{
//        const SenderId = req.user.Id
//        const {name , participants} = req.body;
//        if(!name || !participants){
//         return res.status(400).json({Message:'Please fill the fields'})
//        }

//        const Users = JSON.parse(participants)
//        if(Users.length<2){
//         return res.status(400).json('Group should be more than 2 Users')
//        }
//        Users.push(SenderId)

//        const chat = await Group.create({
//         name:name,
//         participants:participants,
//         isGroup:true,
//         groupAdmin:SenderId

//        })

//        const createdChat = await Group.findOne({id:chat._id})
//        .populate({
//         path:'participants',
//         select:'Username'
//        })

//     }
//     catch(error){

//     }
// }