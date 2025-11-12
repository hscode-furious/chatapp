import Users from "../model/userModel.js";
import Messages from "../model/messageModel.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const contactsForSidebar = async (req, res) => {
  try {
    const loggedUserId = req.user._id;
    const users = await Users.find({ _id: { $ne: loggedUserId } }).select(
      "-password"
    );
    if (users) {
      res.status(200).json(users);
    }
  } catch (error) {
    console.log("error in contactsForSidebar", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const getMessages = async (req, res) => {
  const receiverId = req.params._id;
  const senderId = req.user._id;
  
  try {
    // Validate receiverId format
    if (!receiverId || receiverId === senderId.toString()) {
      return res.status(400).json({ message: "Invalid receiver ID." });
    }

    // Verify that the receiver user exists
    const receiver = await Users.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver user not found." });
    }

    // Only return messages where the logged-in user is either sender or receiver
    // This ensures third parties cannot access messages between other users
    const messages = await Messages.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 }); // Sort by creation time

    res.status(200).json(messages);
  } catch (error) {
    console.log("error in getMessages Controller.", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    res.status(500).json({ message: "Internal server error." });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params._id;

    // Validate that message has content
    if (!text && !image) {
      return res.status(400).json({ message: "Message must have text or image." });
    }

    // Validate receiverId
    if (!receiverId || receiverId === senderId.toString()) {
      return res.status(400).json({ message: "Cannot send message to yourself or invalid receiver." });
    }

    // Verify that the receiver user exists
    const receiver = await Users.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver user not found." });
    }

    console.log("Sending message - Text:", text ? "exists" : "empty", "Image:", image ? "exists" : "empty");

    let imageUrl;
    if (image) {
      console.log("Uploading image to Cloudinary...");
      const uploadImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadImage.secure_url;
      console.log("Cloudinary upload successful:", imageUrl);
    }
    
    const newMessage = new Messages({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();

    console.log("Message saved successfully:", newMessage._id);

    // Only emit to the actual receiver to prevent third-party access
    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log("Message emitted to receiver socket:", receiverSocketId);
    }

    // Also emit to sender for real-time update on their own device
    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("error in sendMessage Controller", error.message);
    console.error("Full error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Validate messageId format
    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required." });
    }

    // Find the message
    const message = await Messages.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Check if user is part of the conversation (sender or receiver)
    // This prevents third parties from accessing or deleting messages
    const isSender = message.senderId.toString() === userId.toString();
    const isReceiver = message.receiverId.toString() === userId.toString();

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: "You are not authorized to delete this message." });
    }

    // Only sender can actually delete the message
    if (!isSender) {
      return res.status(403).json({ message: "Only the sender can delete messages." });
    }

    // Delete the message
    await Messages.findByIdAndDelete(messageId);

    console.log("Message deleted successfully:", messageId);

    // Notify the receiver via socket (only if they're part of the conversation)
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
      console.log("Message deletion emitted to receiver socket:", receiverSocketId);
    }

    // Also notify the sender (in case they have multiple devices)
    const senderSocketId = getReceiverSocketId(userId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }

    res.status(200).json({ message: "Message deleted successfully.", messageId });
  } catch (error) {
    console.log("error in deleteMessage Controller", error.message);
    console.error("Full error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid message ID format." });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};