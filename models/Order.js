const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  memberId: {
    type: Schema.Types.ObjectId,
    ref: "Member", // Reference to the Member model
  },
  memberName: String,
  status: {
    type: String,
    default: 'In Progress' // Set default value to 'In Progress'
},
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product", // Reference to the Product model
      },
    },
  ], 

  refNo: Number,
  itemnumber:String,
  requiredQuantity: [],
  productName: [], 
},{timestamps:true});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;