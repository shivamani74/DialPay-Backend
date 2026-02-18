import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
export const sendMoney = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    let { receiverPhone, amount, pin } = req.body;
     amount = parseFloat(amount);
    const senderId = req.user._id;

    if (!receiverPhone) {
      throw new Error("Enter receiver phone number");
    }

    if (!amount || amount <= 0) {
      throw new Error("Please enter valid amount");
    }

    if (!pin) {
      throw new Error("Enter the PIN");
    }

    const sender = await User.findById(senderId).session(session);

    if (!sender) {
      throw new Error("Sender not found");
    }

    const isPinValid = await bcrypt.compare(pin, sender.pin);

    if (!isPinValid) {
      throw new Error("Invalid PIN");
    }

    if (amount > sender.balance) {
      throw new Error("Insufficient balance");
    }

    const receiver = await User.findOne({ phone: receiverPhone }).session(session);

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    if (receiver._id.toString() === senderId.toString()) {
      throw new Error("Cannot send to yourself");
    }

    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save({ session });
    await receiver.save({ session });

    await Transaction.create(
      [
        {
          sender: sender._id,
          receiver: receiver._id,
          amount,
          type: "debit",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Money Sent Successfully 💸",
      newBalance: sender.balance,
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error("Send Money Error:", error.message);

    res.status(400).json({
      message: error.message || "Transaction Failed",
    });
  }
};
  

export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

const transactions = await Transaction.find({
  $or: [
    { sender: userId, type: "debit" },   // show only sent payments
    { receiver: userId, type: "credit" } // show only received payments
  ]
})
.populate("sender", "name phone")
.populate("receiver", "name phone")
.sort({ createdAt: -1 });

  const formattedTransactions = transactions
  .map((tx) => {
    if (!tx.sender || !tx.receiver) return null;

    const isSender = tx.sender._id.toString() === userId.toString();

    return {
      direction: isSender ? "sent" : "received",
      person: isSender ? tx.receiver.name : tx.sender.name,
      phone: isSender ? tx.receiver.phone : tx.sender.phone,
      amount: tx.amount,
      type: tx.type,
      date: tx.createdAt,
    };
  })
  .filter(Boolean); 


    res.status(200).json({
      message: "Transaction history fetched successfully",
      count: formattedTransactions.length,
      transactions: formattedTransactions,
    });

  } catch (error) {
    console.error("HISTORY ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
