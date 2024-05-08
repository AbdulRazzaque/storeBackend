const mongoose = require("mongoose")

const productScheme = new mongoose.Schema({
    itemCode:{type:String,required:true,},
    productName:{type:String,required:true},
    unit:{type:String,required:true},
    physicalLocation:{type:String,required:true},
    sku:{type:String,required:true},
    lotNumber:{type:String},
    manufacturer:{type:String,required:true},
    supplierName:{type:String,required:true},
    addModel:{type:String},
    department:{type:String,required:true},
},{timestamps:true})

const Product = new mongoose.model("Product",productScheme)
module.exports = Product; 