// const mongoose = require("mongoose")
// const stockScheme = new mongoose.Schema({
//     name:{type:String,default:"",required:true},
//     department:{type:String},
//     product:{type:mongoose.Types.ObjectId,ref:"Product"},
//     totalQuantity:{type:Number,default:0, required:true},
//     expiryArray:[],
//     stockIn:[{type:mongoose.Types.ObjectId,ref:"StockIn"}],
//     stockOut:[{type:mongoose.Types.ObjectId,ref:"StockOut"}],
    
//     // Member:[{type:mongoose.Types.ObjectId,ref:"Member"}]
// },{timestamps:true})

// const Stock = new mongoose.model("Stock",stockScheme)
// module.exports = Stock;

const mongoose = require("mongoose")
const stockScheme = new mongoose.Schema({
    name:{type:String,default:"",required:true},
    department:{type:String},
    product:{type:mongoose.Types.ObjectId,ref:"Product"},
    totalQuantity:{type:Number,default:0, required:true},
    expiryArray:[],
    stockIn:[{type:mongoose.Types.ObjectId,ref:"StockIn"}],
    stockOut:[{type:mongoose.Types.ObjectId,ref:"StockOut"}],
    Discard:[{type:mongoose.Types.ObjectId,ref:"Discard"}],
    
    // Member:[{type:mongoose.Types.ObjectId,ref:"Member"}]
},{timestamps:true})

const Stock = new mongoose.model("Stock",stockScheme)
module.exports = Stock;