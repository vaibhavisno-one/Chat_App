import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: { // For direct messages, this will be a User. For team messages, it might be null or unused.
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make this optional as it's not used for 'team' type messages
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    teamId: { // New field
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: false, // Only present for messages of type 'team'
    },
    type: { // New field
      type: String,
      enum: ['team', 'direct'],
      required: true,
      default: 'direct',
    }
  },
  { timestamps: true }
);

// Add an index for querying messages by teamId if this will be a common operation
messageSchema.index({ teamId: 1 });
// Add an index for querying direct messages
messageSchema.index({ senderId: 1, receiverId: 1, type: 1 });


const Message = mongoose.model("Message", messageSchema);

export default Message;
