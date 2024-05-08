const mongoose = require("mongoose")

const stockOutScheme = new mongoose.Schema({
    name:{type:String,default:"",required:true},
    docNo:{type:Number,default:1},
    // memberId:{type:mongoose.Types.ObjectId,ref:"members"},
    memberName:{type:String,default:"",required:true},
    department:{type:String,default:"",required:true},
    productId:{type:mongoose.Types.ObjectId,ref:"Product"},
    quantity:{type:Number,default:0, required:true},
    date:{type:Date},
    expiry:{type:Date},
    prevQuantity:{type:Number,default:0},
},{timestamps:true})

const StockOut = new mongoose.model("StockOut",stockOutScheme)
module.exports = StockOut;