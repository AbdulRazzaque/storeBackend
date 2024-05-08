const mongoose = require("mongoose")

const stockInScheme = new mongoose.Schema({
    docNo:{type:Number,default:1},
    department:{type:String, required:true},
    itemCode:{type:String,default:""},
    name:{type:String,default:""},
    productId:{type:mongoose.Types.ObjectId,ref:"Product"},
    quantity:{type:Number,default:0, required:true},
    prevQuantity:{type:Number,default:0},
    expiry:{type:Date},

},{timestamps:true})

const StockIn = new mongoose.model("StockIn",stockInScheme)
module.exports = StockIn; 