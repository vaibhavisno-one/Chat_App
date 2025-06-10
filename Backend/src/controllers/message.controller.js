// Backend/src/controllers/message.controller.js
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Team from "../models/team.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const currentUserTeamId = req.user.team;

    if (!currentUserTeamId) {
      return res.status(200).json([]);
    }
    const currentTeam = await Team.findById(currentUserTeamId);
    if (!currentTeam) {
        return res.status(404).json({ error: "Current team not found." });
    }
    const filteredUsers = await User.find({
      _id: { $in: currentTeam.members, $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, messageType } = req.body;
    const { chatId } = req.params;
    const senderId = req.user._id;
    const senderTeamId = req.user.team;

    if (!senderTeamId) {
      return res.status(403).json({ error: "You must be in a team to send messages." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let newMessage;

    if (messageType === 'direct') {
      const receiverId = chatId;
      if (senderId.toString() === receiverId.toString()) {
        return res.status(400).json({ error: "You cannot send messages to yourself." });
      }

      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found." });
      }
      if (!receiver.team || receiver.team.toString() !== senderTeamId.toString()) {
        return res.status(403).json({ error: "Receiver is not in your current team." });
      }

      newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        type: 'direct',
        teamId: senderTeamId,
      });

      await newMessage.save();

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

    } else if (messageType === 'team') {
      const targetTeamId = chatId;
      if (targetTeamId !== senderTeamId.toString()) {
        return res.status(403).json({ error: "You can only send messages to your own team." });
      }

      newMessage = new Message({
        senderId,
        text,
        image: imageUrl,
        type: 'team',
        teamId: senderTeamId,
      });

      await newMessage.save();
      io.to(senderTeamId.toString()).emit("newMessage", newMessage);

    } else {
      return res.status(400).json({ error: "Invalid message type." });
    }

    res.status(201).json(newMessage);

  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: "Invalid ID format for chat ID." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const myTeamId = req.user.team;

    if (!myTeamId) {
      return res.status(403).json({ error: "You must be in a team to view messages." });
    }

    let messages;

    if (req.params.userId) { // Fetching direct messages
      const userToChatId = req.params.userId;

      if (myId.toString() === userToChatId.toString()) {
        return res.status(400).json({ error: "Cannot fetch chat history with yourself." });
      }

      const otherUser = await User.findById(userToChatId);
      if (!otherUser) {
          return res.status(404).json({ error: "Other user not found." });
      }
      if (!otherUser.team || otherUser.team.toString() !== myTeamId.toString()) {
          return res.status(403).json({ error: "Other user is not in your current team." });
      }

      messages = await Message.find({
        teamId: myTeamId,
        type: 'direct',
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      }).sort({ createdAt: 1 });

    } else if (req.params.teamId) { // Fetching team messages
      const requestedTeamId = req.params.teamId;

      if (requestedTeamId !== myTeamId.toString()) {
        return res.status(403).json({ error: "You can only view messages for your own team." });
      }

      messages = await Message.find({
        teamId: myTeamId,
        type: 'team',
      }).sort({ createdAt: 1 });

    } else {
      return res.status(400).json({ error: "Invalid request for messages." });
    }

    res.status(200).json(messages);

  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: "Invalid ID format provided." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};