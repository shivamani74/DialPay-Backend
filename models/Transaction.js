import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema(
    {
        sender:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
        receiver:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
        amount:{type:Number,required:true},
        type:{type:String,enum:["credit","debit"],required:true},
    },
    {timestamps:true}
);

export default mongoose.model("Transaction",transactionSchema);