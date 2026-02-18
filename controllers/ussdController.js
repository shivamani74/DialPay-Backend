import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import bcrypt from "bcryptjs";

let sessions = {};

export const handleUSSD = async (req, res) => {
  const phone = String(req.body.phone).trim();
  const text = String(req.body.text || "").trim();

  // 🚨 ensure sender exists before starting session
  const senderExists = await User.findOne({ phone });
  if (!senderExists) {
    return res.json({ message: "User not registered in DialPay" });
  }

  // 🟢 FIRST DIAL (*99#)
  if (!sessions[phone]) {
    sessions[phone] = { step: "MENU" };

    return res.json({
      message: `DialPay *99#
1. Check Balance
2. Send Money
3. Mini Statement
4. Exit`,
    });
  }

  const userSession = sessions[phone];

  switch (userSession.step) {

    // ================= MENU =================
    case "MENU":
      if (text === "1") {
        const user = await User.findOne({ phone });
        delete sessions[phone];
        return res.json({ message: `Your balance is ₹${user.balance}` });
      }

      if (text === "2") {
        userSession.step = "ENTER_RECEIVER";
        return res.json({ message: "Enter receiver phone:" });
      }

      if (text === "3") {
        const user = await User.findOne({ phone });

        const tx = await Transaction.find({
          $or: [{ sender: user._id }, { receiver: user._id }],
        }).sort({ createdAt: -1 }).limit(5);

        delete sessions[phone];
        return res.json({ message: `You have ${tx.length} recent transactions` });
      }

      delete sessions[phone];
      return res.json({ message: "Session Ended" });

    // ================= ENTER RECEIVER =================
    case "ENTER_RECEIVER":
      userSession.receiverPhone = text;
      userSession.step = "ENTER_AMOUNT";
      return res.json({ message: "Enter amount:" });

    // ================= ENTER AMOUNT =================
    case "ENTER_AMOUNT":
      const amount = Number(text);

      if (!amount || amount <= 0) {
        delete sessions[phone];
        return res.json({ message: "Invalid amount. Start again." });
      }

      userSession.amount = amount;
      userSession.step = "ENTER_PIN";
      return res.json({ message: "Enter PIN:" });

    // ================= ENTER PIN =================
    case "ENTER_PIN":
      try {
        const sender = await User.findOne({ phone });
        const receiver = await User.findOne({ phone: userSession.receiverPhone });

        if (!receiver) {
          delete sessions[phone];
          return res.json({ message: "Receiver not found" });
        }

        if (receiver.phone === sender.phone) {
          delete sessions[phone];
          return res.json({ message: "Cannot send to yourself" });
        }

        if (sender.balance < userSession.amount) {
          delete sessions[phone];
          return res.json({ message: "Insufficient balance" });
        }

        const isValidPin = await bcrypt.compare(text, sender.pin);
        if (!isValidPin) {
          delete sessions[phone];
          return res.json({ message: "Invalid PIN" });
        }

        // 💸 UPDATE BALANCES
        sender.balance -= userSession.amount;
        receiver.balance += userSession.amount;

        await sender.save();
        await receiver.save();

        // 🧾 CREATE TRANSACTION RECORD
        await Transaction.create([
          {
            sender: sender._id,
            receiver: receiver._id,
            amount: userSession.amount,
            type: "debit",
          },
          {
            sender: sender._id,
            receiver: receiver._id,
            amount: userSession.amount,
            type: "credit",
          },
        ]);

        delete sessions[phone];
        return res.json({ message: "Payment Successful 💸" });

      } catch (error) {
        delete sessions[phone];
        return res.json({ message: "Transaction Failed" });
      }
  }
};
