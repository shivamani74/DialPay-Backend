import User from "../models/User.js";

export const checkBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("balance name phone");

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    return res.status(200).json({
      message: "Balance fetched successfully",
      balance: user.balance,
    });

  } catch (error) {
    console.error("Error Balance:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
