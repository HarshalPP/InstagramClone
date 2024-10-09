const Room = require('../models/Room');
const { generateAgoraToken } = require('../Utils/AgoraVideocall');

// Create or join a video call room
exports.joinRoom = async (req, res) => {
  const { roomId} = req.body;
  const userId = req.user._id

  // Check if room exists, if not, create one
  let room = await Room.findOne({ roomId });
  if (!room) {
    room = new Room({ roomId, participants: [userId] });
    await room.save();
  } else {
    // Add user to room if not already added
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }
  }

  // Generate Agora token
  const token = generateAgoraToken(roomId, userId);

  res.status(200).json({ token, roomId });
};

