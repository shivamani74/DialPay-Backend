import axios from "axios";

export const sendOTP = async (phone, otp) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your DialPay OTP is ${otp}`,
        language: "english",
        numbers: phone
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("SMS Error:", error.response?.data || error.message);
    throw new Error("Failed to send OTP");
  }
};
