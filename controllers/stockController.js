const mongoose = require('mongoose')
const Product = require("../models/Product")
const Stock = require("../models/Stock")
const StockIn = require("../models/StockIn")
const StockOut = require("../models/StockOut")
const bcrypt = require('bcrypt');
const date = require('date-and-time');
const jwt = require("jsonwebtoken")
const moment = require("moment")
const Discard = require('../models/DiscardedItem')

class ProductController{
    async getProduct (req,res){
        res.send("home routre user")
    }

    async getAllStocks(req, res) {
        const { departmentName } = req.params; // Assuming departmentName is passed as a parameter in the request
      
        const stocks = await Stock.find({ department: departmentName }, { stockIn: 0, stockOut: 0 })
          .populate("product")
          .populate("department")
          .populate({
            path: "stockIn"
          });
       
        res.status(200).send({ msg: "successfully", result: stocks });
      }

  async stockIn(req, res) {
    let { docNo, department, itemCode, productId, quantity, expiry, stockInId } = req.body;
    if (!docNo || !department || !itemCode || !productId || !quantity || !expiry ) {
        res.status(400).send({ msg: "Fill all required fields" });
    } else {
        quantity = parseInt(quantity);

        let stockInEntry;
        let stockFind;

        if (stockInId) {
            // Update existing stock-in entry
            stockInEntry = await StockIn.findById(stockInId);
            if (!stockInEntry) {
                return res.status(404).send({ msg: "StockIn entry not found" });
            }
            let prevQuantity = stockInEntry.quantity; // Store the previous quantity
            stockInEntry.quantity = quantity;
            stockInEntry.expiry = expiry;
            
            await stockInEntry.save();

            stockFind = await Stock.findOne({ product: mongoose.Types.ObjectId(productId), department: department });
            if (!stockFind) {
                return res.status(404).send({ msg: "Stock entry not found" });
            }

            // Update stock expiry array and total quantity
            let existingExpiryEntry = stockFind.expiryArray.find(entry => entry.expiry.getTime() === new Date(expiry).getTime());

            if (existingExpiryEntry) {
                existingExpiryEntry.quantity += quantity - prevQuantity; // Update the quantity difference
            } else {
                stockFind.expiryArray.push({ expiry: new Date(expiry), quantity, prevQuantity });
            }
            let totalQuantity = stockFind.expiryArray.reduce((acc, entry) => acc + entry.quantity, 0);
            await Stock.updateOne(
                { product: mongoose.Types.ObjectId(productId), department: department },
                { $set: { expiryArray: stockFind.expiryArray, totalQuantity } }
            );

        } else {
            // Check if a stock entry already exists for the product and department
            stockFind = await Stock.findOne({ product: mongoose.Types.ObjectId(productId), department: department });

            if (stockFind) {
                // Update existing stock entry
                let existingExpiryEntry = stockFind.expiryArray.find(entry => entry.expiry.getTime() === new Date(expiry).getTime());

                if (existingExpiryEntry) {
                    existingExpiryEntry.quantity += quantity;
                } else {
                    stockFind.expiryArray.push({ expiry: new Date(expiry), quantity, prevQuantity: 0 });
                }
                let totalQuantity = stockFind.expiryArray.reduce((acc, entry) => acc + entry.quantity, 0);
                await Stock.updateOne(
                    { product: mongoose.Types.ObjectId(productId), department: department },
                    { $set: { expiryArray: stockFind.expiryArray, totalQuantity } }
                );

                // Create new stock-in entry
                const newStockIn = new StockIn({
                    name: req.body.productName,
                    productId,
                    itemCode,
                    department,
                    docNo,
                    quantity,
                    expiry,
                  
                    prevQuantity: stockFind.totalQuantity // Set prevQuantity to totalQuantity of existing stock entry
                });
                stockInEntry = await newStockIn.save();

            } else {
                // Create new stock entry
                const newStock = new Stock({
                    name: req.body.productName,
                    product: mongoose.Types.ObjectId(productId),
                    totalQuantity: quantity,
                    department: department,
                    expiryArray: [{ expiry: new Date(expiry), quantity, prevQuantity:  0 }],
                    stockIn: [stockInEntry?._id]
                });
                await newStock.save();

                // Create new stock-in entry
                const newStockIn = new StockIn({
                    name: req.body.productName,
                    productId,
                    itemCode,
                    department,
                    docNo,
                    quantity,
                    expiry,
              
                    prevQuantity: 0 // Set prevQuantity to 0 for new stock-in entry
                });
                stockInEntry = await newStockIn.save();
            }
        }

        res.status(200).send({ msg: "Product added successfully", result: stockInEntry });
        }
    }

async stockOuts(req, res) {
    console.log("Stockout start--------------------------------- body", req.body)
    const { unit, productName, productId, docNo, department, quantity, date, memberName, expiry, price, stockOutId } = req.body;

    if (!docNo || !department || !productId || !quantity || !expiry || !memberName) {
        res.status(400).send("Bad Request");
        return;
    }

    let parsedQuantity = parseInt(quantity);
    let newExpiryArray = []
    let totalQuantity = 0
    let stockIndoc = null
    let existingStock = null
    let newStock = null;
    // If the parsed quantity is positive, convert it to negative
    if (parsedQuantity > 0) {
        parsedQuantity = -parsedQuantity;
    }
    if (!expiry) {
        //new stock
        newStock = new Stock({
            name: productName,
            product: mongoose.Types.ObjectId(productId),
            totalQuantity: parsedQuantity,
            expiryArray: [],
            department: department
        })
    } else {
        existingStock = await Stock.findOne({
            name: productName,
            department: department,
            "expiryArray": {
                $elemMatch: {
                    "expiry": new Date(expiry)
                }
            }
        });
        stockIndoc = await StockIn.findOne({ name: productName, department: department }).sort({ createdAt: -1 })
    }

    if (existingStock) {
        // Create a new expiry array object if it exist
        if (expiry) {
            newExpiryArray = existingStock.expiryArray.map(item => {
                console.log(item.expiry, new Date(expiry))
                if (item.expiry.toString() === new Date(expiry).toString()) {
                    item.prevQuantity = item.quantity
                    item.quantity = item.quantity - quantity
                }
                return item
            });
        }
        console.log("Existing Stock-----StockInDoc", existingStock, stockIndoc)
    }

    // Create a new stock-out record
    const newStockOut = new StockOut({
        name: productName,
        docNo,
        department,
        quantity,
        date,
        memberName,
        unit,
        productId: mongoose.Types.ObjectId(productId),
        expiry: expiry ? new Date(expiry) : null,
        stockInPrice: stockIndoc ? stockIndoc.price : 0,
        prevQuantity: existingStock ? existingStock.totalQuantity : 0,
        price: parseFloat(price)
    });

    const stockOutResponse = await newStockOut.save();
    console.log("stockout response------", stockOutResponse)
    if (!expiry && newStock) {
        newStock.stockOut = [stockOutResponse._id]
        let newStockAdd = await newStock.save()
        console.log("new stock added-----", newStockAdd)

    } else {
        newExpiryArray.map(item => {
            totalQuantity = totalQuantity + item.quantity
        })
        const stockUpdate = await Stock.updateOne({ product: mongoose.Types.ObjectId(productId), department: department }, { $set: { expiryArray: newExpiryArray, totalQuantity }, $push: { stockOut: stockOutResponse._id } })
        console.log("currentSTockupdate-----", stockUpdate)
    }

    res.status(200).send({ msg: 'success', result: stockOutResponse });
}







// async stockOuts(req, res) {
//     let { docNo, department, productId, quantity, expiry, memberName, stockOutId } = req.body;

//     if (!docNo || !department || !productId || !quantity || !expiry || !memberName) {
//         res.status(400).send({ msg: "Fill all required fields" });
//     } else {
//         quantity = parseInt(quantity);

//         let stockFind = await Stock.findOne({ product: mongoose.Types.ObjectId(productId), department: department });

//         if (stockFind) {
//             let stockOutEntry;
//             if (stockOutId) {
//                 // Update existing stockOut entry
//                 stockOutEntry = await StockOut.findById(stockOutId);
//                 if (!stockOutEntry) {
//                     return res.status(404).send({ msg: "StockOut entry not found" });
//                 }
//                 let prevQuantity = stockOutEntry.quantity; // Store the previous quantity
//                 stockFind.totalQuantity += prevQuantity; // Restore previous quantity
//                 stockOutEntry.quantity = quantity;
//                 stockOutEntry.expiry = expiry;
//                 stockOutEntry.memberName = memberName;
//                 await stockOutEntry.save();

//                 // Deduct new quantity from stock
//                 stockFind.totalQuantity -= quantity;
//                 await stockFind.save();

//                 // Update quantity in stock's expiry array if expiry matches
//                 let existingExpiryEntry = stockFind.expiryArray.find(entry => entry.expiry.getTime() === new Date(expiry).getTime());
//                 if (existingExpiryEntry) {
//                     existingExpiryEntry.quantity -= quantity;
//                     await stockFind.save();
//                 }
//             } else {
//                 // Create new stockOut entry
//                 stockOutEntry = new StockOut({
//                     name: req.body.productName,
//                     productId,
//                     department,
//                     memberName,
//                     docNo,
//                     quantity,
//                     expiry,
//                     prevQuantity: stockFind.totalQuantity
//                 });
//                 stockOutEntry = await stockOutEntry.save();

//                 // Deduct quantity from stock
//                 stockFind.totalQuantity -= quantity;
//                 await stockFind.save();

//                 // Update quantity in stock's expiry array if expiry matches
//                 let existingExpiryEntry = stockFind.expiryArray.find(entry => entry.expiry.getTime() === new Date(expiry).getTime());
//                 if (existingExpiryEntry) {
//                     existingExpiryEntry.quantity -= quantity;
//                     await stockFind.save();
//                 }
//             }

//             res.status(200).send({ msg: "Product stock out successfully", result: stockOutEntry });
//         } else {
//             res.status(404).send({ msg: "Product not found in stock" });
//         }
//         }
//     }




      // async getAllStocksNew(req, res) {
      //   const aggregatedStocks = await Stock.aggregate([
      //       {
      //         $lookup: {
      //           from: "products",
      //           localField: "product",
      //           foreignField: "_id",
      //           as: "productDetails"
      //         }
      //       },
      //       {
      //         $unwind: "$productDetails"
      //       },
      //       {
      //         $group: {
      //           _id: "$name",
      //           totalQuantity: { $sum: "$quantity" }, // New field to sum up the quantity
      //           products: {
      //             $push: {
      //               product: "$productDetails",
      //               quantity: "$quantity",
      //               expiry: "$expiry",
      //               createdAt: "$createdAt",
      //               updatedAt: "$updatedAt",
      //             }
      //           }
      //         }
      //       },
      //       {
      //         $sort: { _id: 1 }
      //       }
      //     ]);
          
      //   res.status(200).send({ msg: "success", result: aggregatedStocks });
      // }

    
//     async stockIn(req, res) {
//       let { docNo, department, itemCode, productId, quantity, expiry } = req.body;
  
//       console.log("Stock IN -------");
//       console.log(req.body);
  
//       if (!docNo || !department || !itemCode || !productId || !quantity || !expiry) {
//           res.status(400).send({ msg: "Fill all required fields" });
//       } else {
//           quantity = parseInt(quantity);
  
//           let stockFind = await Stock.findOne({ product: mongoose.Types.ObjectId(productId) ,department});
  
//           console.log("stockfind", stockFind);
  
//           if (stockFind) {
//               const newStockIn = new StockIn({
//                   name: req.body.productName,
//                   productId,
//                   itemCode,
//                   department: req.body.department,
//                   docNo,
//                   quantity,
//                   expiry,
//                   prevQuantity: stockFind.quantity
//               });
  
//               const stockInResponse = await newStockIn.save();
//               let newExpiryArray = [];
  
//               if (stockFind.expiryArray.length > 0) {
//                   let checkExpiryExistenceArray = stockFind.expiryArray.filter(i => moment.parseZone(i.expiry).local().format("DD/MM/YY") === moment.parseZone(expiry).local().format("DD/MM/YY"));
  
//                   if (checkExpiryExistenceArray.length > 0) {
//                       newExpiryArray = stockFind.expiryArray.map((i, index) => {
//                           if (moment.parseZone(i.expiry).local().format("DD/MM/YY") === moment.parseZone(expiry).local().format("DD/MM/YY")) {
//                               i.prevQuantity = i.quantity;
//                               i.quantity = i.quantity + quantity;
//                           }
//                           return i;
//                       });
//                   } else {
//                       newExpiryArray = stockFind.expiryArray;
//                       newExpiryArray.push({ expiry: new Date(expiry), quantity, prevQuantity: 0 });
//                   }
//               } else {
//                   newExpiryArray = [{ prevQuantity: stockFind.totalQuantity, quantity: stockFind.totalQuantity + quantity, expiry: new Date(expiry) }];
//               }
  
//               let totalQuantity = 0;
//               newExpiryArray.forEach(i => {
//                   totalQuantity += i.quantity;
//               });
  
//               const stockUpdate = await Stock.updateOne({ product: mongoose.Types.ObjectId(productId) }, { $set: { expiryArray: newExpiryArray, totalQuantity }, $push: { stockIn: stockInResponse._id } });
  
//               console.log(stockUpdate, 'stockUpdate');
  
//               res.status(200).send({ msg: 'Product added successfully', result: stockInResponse });
//           } else {
//               console.log("inside new stocks and stockin");
  
//               const newStockIn = new StockIn({
//                   name: req.body.productName,
//                   productId,
//                   itemCode,
//                   department: req.body.department,
//                   docNo,
//                   quantity,
//                   expiry,
//                   prevQuantity: stockFind?.quantity
//               });
  
//               const stockInResponse = await newStockIn.save();
  
//               const newStock = new Stock({
//                   name: req.body.productName,
//                   product: mongoose.Types.ObjectId(productId),
//                   totalQuantity: quantity,
//                   department: req.body.department,
//                   expiryArray: [{ expiry: new Date(expiry), quantity, prevQuantity: 0 }],
//                   stockIn: [stockInResponse._id]
//               });
  
//               newStock.save()
//                   .then(newStockResponse => {
//                       res.status(200).send({ msg: 'Product added successfully', result: stockInResponse });
//                   })
//                   .catch(error => {
//                       res.status(500).send({ msg: 'Error occurred while saving new stock', error });
//                   });
//           }
//       }
//   }
  
// Abdur rahim stock In api only i remove unit fild



async  updateStockAndExpiryArray(productId, oldQuantity, newQuantity, expiry) {
    // Logic for updating stock and expiryArray
    let stockFind = await Stock.findOne({ product: mongoose.Types.ObjectId(productId) });

    if (stockFind) {
        let newExpiryArray = [];
        if (stockFind.expiryArray.length > 0) {
            let checkExpiryExistenceArray = stockFind.expiryArray.filter(i => moment.parseZone(i.expiry).local().format("DD/MM/YY") === moment.parseZone(expiry).local().format("DD/MM/YY"));

            if (checkExpiryExistenceArray.length > 0) {
                newExpiryArray = stockFind.expiryArray.map((i, index) => {
                    if (moment.parseZone(i.expiry).local().format("DD/MM/YY") === moment.parseZone(expiry).local().format("DD/MM/YY")) {
                        i.prevQuantity = i.quantity;
                        i.quantity = i.quantity + newQuantity - oldQuantity;
                    }
                    return i;
                });
            } else {
                newExpiryArray = stockFind.expiryArray;
                newExpiryArray.push({ expiry: new Date(expiry), quantity: newQuantity, prevQuantity: 0 });
            }
        } else {
            newExpiryArray = [{ prevQuantity: stockFind.totalQuantity, quantity: newQuantity, expiry: new Date(expiry) }];
        }

        let totalQuantity = 0;
        newExpiryArray.map(i => {
            totalQuantity = totalQuantity + i.quantity;
        });

        await Stock.updateOne({ product: mongoose.Types.ObjectId(productId) }, { $set: { expiryArray: newExpiryArray, totalQuantity } });
    } else {
        const newStock = new Stock({
            product: mongoose.Types.ObjectId(productId),
            totalQuantity: newQuantity,
            expiryArray: [{ expiry: new Date(expiry), quantity: newQuantity, prevQuantity: 0 }]
        });
        await newStock.save();
    }
}

    
     
    async stockInUpdateQuantity(req,res){ //6450eb9087560398aa7377b9 //"Novacoc"
        // if(!req.body.id || req.body.quantity===null || !req.body.productName || !req.body.originalQuantity){ //originalquantity is the original quantity of stock In and quantity is the latest modiefied qunatity
        // res.status(400).send("Bad Request")
        // }else{   
            let price =0
            const {id,quantity,productName,originalQuantity}=req.body;
         let update=   StockIn.updateOne({_id:mongoose.Types.ObjectId(req.body.id)},{quantity:parseInt(req.body.quantity),
                prevQuantity:parseInt(req.body.originalQuantity)})
            .then(response=>{
                // console.log(req.body.originalQuantity,'req.body.originalQuantity')
                // console.log(req.body.quantity,'req.body.quantity')
                let finalquantity = price  + parseInt(req.body.originalQuantity)
                // console.log(finalquantity,'finalquantity')
                   Stock.updateOne({name:req.body.productName},{$inc:{quantity: finalquantity}})

                    .then(responses=>{
                       
                        res.status(200).send({msg:"success",result:"Successfully updated quantity"})
                    })
            })
        // }
        console.log(update)
        
    }

    async stockOutUpdateQuantity(req,res){
        // const {id,quantity,productName,originalQuantity}=req.body
        let prise =0
        if(!req.body.id || !req.body.quantity || !req.body.productName || !req.body.originalQuantity){
            res.status(400).send("Bad Request")
        }else{
         await   StockOut.updateOne({_id:mongoose.Types.ObjectId(req.body.id)},{quantity:parseInt(req.body.quantity),
            prevQuantity:parseInt(req.body.originalQuantity)})
            .then(response=>{
                console.log(prise,'prise')
                 console.log(req.body.quantity,'req.body.quantity')
                 let finalquantity = prise - parseInt(req.body.quantity)
                 console.log(finalquantity,'finalquantity')
                 
                 //yaha par orginal quantity agar 20 hai aur abhi editing quantity 10 hai to 20-10=10 yani 10 hi quantity stockout hui isiliey 10 add kardo
            Stock.updateOne({name:req.body.productName},{$inc:{quantity:finalquantity}})
                .then(responses=>{
                    res.status(200).send({msg:"success",result:responses})
                })
            })
        }
    }



    async stockInDelete(req,res){
        if(!req.body.id || !req.body.quantity || !req.body.productName){
            res.status(400).send("Bad Request")
        }else{
            StockIn.deleteOne({_id:mongoose.Types.ObjectId(req.body.id)})
            .then(response=>{
                // res.status(200).send({msg:"success",result:response})
                Stock.updateOne({name:req.body.productName},{$inc:{quantity:-parseInt(req.body.quantity)}})
                .then(responses=>{
                    res.status(200).send({msg:"success",result:responses})
                })
            })
        }
        
    }
    async stockOutDelete(req,res){
        if(!req.body.id || !req.body.quantity || !req.body.productName){
            res.status(400).send("Bad Request")
        }else{
            StockOut.deleteOne({_id:mongoose.Types.ObjectId(req.body.id)})
            .then(response=>{
                // res.status(200).send({msg:"success",result:response})
                Stock.updateOne({name:req.body.productName},{$inc:{quantity:parseInt(req.body.quantity)}})
                .then(responses=>{
                    res.status(200).send({msg:"success",result:responses})
                })
            })
        }
    }

    async updatestockIn(req,res){
        try {
            let {productType,productName,companyName,productId,supplierId,supplierDocNo,quantity,price,expiry,docNo,unit} = req.body;
            if(!productType||!productName||!companyName||!productId||!supplierId||!supplierDocNo||!quantity||!price||!expiry||!docNo||!unit){
                res.status(400).send("Bad Request")
          console.log(req.body)
            }else{
                quantity = parseInt(quantity)
                // price = parseInt(price)
                price = parseFloat(price)
                
                Stock.findOneAndUpdate({name:req.body.productName})
                .then(async response=>{
                    const newStockIn = new StockIn({
                        name:productName,
                        companyName,
                        productType,
                        docNo,
                        supplierDocNo,
                        supplier:supplierId,
                        quantity,
                        price,
                        expiry,
                        unit
                    },{new: true})
                    const stockInResponse = await newStockIn.save()
                    if(response){
                        //product already exist increase quantity and stock in
                        Stock.findOneAndUpdate({_id:response._id},{$inc:{quantity:quantity},$push:{stockIn:stockInResponse._id}})
                        .then(async stockUpdateResponse=>{
                            console.log(stockUpdateResponse)
                            await StockIn.updateOne({_id:stockInResponse._id},{$set:{prevQuantity:stockUpdateResponse.quantity}})
                            res.status(200).send({msg:'success',result:stockInResponse})
                        })
                    }else{
                        //product doesn't exist stock in and create
                            const newStock = new Stock({
                                name:productName,
                                product:mongoose.Types.ObjectId(productId),
                                quantity,
                                stockIn:[stockInResponse._id]
                            })
                            newStock.save()
                            .then(newStockResponse=>{
                                res.status(200).send({msg:'success',result:stockInResponse})
                            })
                    }
                })
            }
        } catch (error) {
            console.log(error)
        }
    }


    async deleteStockIn(req,res){
        //stock in ki ID bhejo aur jo stockin ki quantity thi, wo bhi bhejo
        console.log(req.body)
        const expiryDateToUpdate = new Date(req.body.expiry); // Replace with the actual expiry date
        const decreaseQuantityBy = req.body.quantity; // Replace with the amount you want to decrease
        StockIn.deleteOne({_id:mongoose.Types.ObjectId(req.body.stockInId)})
        .then(response=>{
            console.log(response)
            Stock.updateOne(
                {
                    name: req.body.productName,
                    'expiryArray.expiry': expiryDateToUpdate
                },
                {
                    $inc: {
                        'expiryArray.$.quantity':-decreaseQuantityBy,
                        'totalQuantity':-decreaseQuantityBy
                    },
                    'expiryArray.$.prevQuantity': decreaseQuantityBy,
                    $pull: {
                        'stockIn': mongoose.Types.ObjectId(req.body.stockInId)
                      }
                }
                )
                .then(stockresponse=>{
                    console.log(stockresponse)
                    res.status(200).send({msg:"success",result:"Successfully Removed StockIn"}) 
                })
        })
    }
   

    async deleteStockOut(req, res) {
        console.log(req.body,'delete stockout')
        try {
            const { stockOutId, productName, expiry, quantity } = req.body;
    
            // Check if the stock-out record exists
            const existingStockOut = await StockOut.findById(stockOutId);
            if (!existingStockOut) {
                throw new Error("Stock-out not found");
            }
    
            // Delete the stock-out record
            await StockOut.deleteOne({ _id: stockOutId });
    
            // Find the stock record
            const stock = await Stock.findOne({ name: productName });
    
            if (stock) {
                // Find the expiry array item for the given expiry date
                const expiryArrayItem = stock.expiryArray.find(item => item.expiry.toString() === new Date(expiry).toString());
                if (expiryArrayItem) {
                    // Increase the quantity by the deleted quantity
                    console.log("Before update:", JSON.stringify(expiryArrayItem));
                    expiryArrayItem.quantity += quantity;
                    stock.markModified('expiryArray');
                    console.log("After update:", JSON.stringify(expiryArrayItem));
                
                    // Update the total quantity in the stock record
                    stock.totalQuantity += quantity;
                
                    // Remove the stock-out reference
                    stock.stockOut = stock.stockOut.filter(id => id.toString() !== stockOutId);
                
                    // Save the updated stock record
                    await stock.save();
                    
                    res.status(200).send({ msg: "success", result: "Successfully Removed Stock-out" });
                }
                 else {
                    res.status(404).send({ msg: "error", result: "Expiry array item not found" });
                }
            } else {
                res.status(404).send({ msg: "error", result: "Stock not found" });
            }
        } catch (error) {
            console.error("Error deleting stock-out:", error);
            res.status(500).send({ msg: "error", result: "Internal Server Error" });
        }
    }

    async getPrevStockOutInfo(req, res) {
        console.log(req.body);
        if (!req.body.start || !req.body.end || !req.body.department || !req.body.productId) {
            // If any of the required parameters are missing, send a Bad Request response
            res.status(400).send("Bad Request");
        } else {
            // If all required parameters are present, proceed with processing
            let startDate = new Date(req.body.start); // Parse start date
            let endDate = new Date(req.body.end); // Parse end date
            const department = req.body.department; // Extract department from request body
            const productIds = req.body.productId; // Extract product IDs from request body
            
            // Find stock out information based on provided criteria
            try {
                const response = await StockOut.find({
                    productId: { $in: productIds.map(id => mongoose.Types.ObjectId(id)) }, // Filter by product IDs
                    department: department, // Filter by department
                    createdAt: { $gte: startDate, $lte: endDate } // Filter by date range
                }).exec();
                
                // Send success response with the found results
                res.status(200).send({ msg: "success", result: response });
            } catch (error) {
                // Handle any errors that occur during the process
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        }
    }
    
    // async getPrevStockInInfo(req,res){
    //     console.log(req.body)
    //     if(!req.body.start || !req.body.end || !req.body.department || !req.body.productId){
    //         res.status(400).send("Bad Request")
    //     }else{
    //         // let d1 = date.parse(req.body.to, 'YYYY/MM/DD');
    //         // let d2 = date.parse(req.body.from, 'YYYY/MM/DD'); //format - '2023/01/10'
    //         // console.log(d1)
    //         // StockIn.find({name:req.body.productType,$and:[{createdAt:{$gt:d1}},{createdAt:{$lt:d2}}]})
    //         var startDate = new Date(req.body.start); // Replace with your start date
    //         var endDate = new Date(req.body.end);   // Replace with your end date
    //         var department = n(req.body.department);   // Replace with your end date
    //         // var productIds = req.body.productId;  // Replace with your array of productIds
            
    //         // StockIn.aggregate([
    //         //   {
    //         //     $match: {
    //         //       $and: [
    //         //         { createdAt: { $gte: startDate, $lte: endDate } },
    //         //         { productId: { $in: productIds.map(pid => mongoose.Types.ObjectId(pid)) } }
    //         //       ]
    //         //     }
    //         //   },
    //         //   {
    //         //     $lookup: {
    //         //       from: "stockOut",
    //         //       localField: "productId",
    //         //       foreignField: "productId",
    //         //       as: "stockOutData"
    //         //     }
    //         //   },
    //         //   {
    //         //     $unwind: {
    //         //       path: "$stockOutData",
    //         //       preserveNullAndEmptyArrays: true
    //         //     }
    //         //   },
    //         //   {
    //         //     $project: {
    //         //       _id: 0,
    //         //       name: 1,
    //         //       companyName: 1,
    //         //       productType: 1,
    //         //       docNo: 1,
    //         //       supplierDocNo: 1,
    //         //       supplier: 1,
    //         //       productId: 1,
    //         //       quantityDifference: {
    //         //         $subtract: [
    //         //           { $ifNull: ["$quantity", 0] },
    //         //           { $ifNull: ["$stockOutData.quantity", 0] }
    //         //         ]
    //         //       },
    //         //       price: 1,
    //         //       prevQuantity: 1,
    //         //       expiry: 1,
    //         //       unit: 1,
    //         //       createdAt: 1,
    //         //       updatedAt: 1,
    //         //       __v: 1
    //         //       // Add more fields as needed
    //         //     }
    //         //   }
    //         // ])
            
    //         const productIds = req.body.productId; // Assuming productIds is an array

    //         // StockIn.find({
    //         //   createdAt: {
    //         //     $gte: new Date(req.body.start),
    //         //     $lte: new Date(req.body.end)
    //         //   },
    //         //   productId: { $in: productIds }
    //         // })    
    //         StockIn.aggregate([
    //           {
    //             $match: {
    //               createdAt: { $gte: startDate, $lte: endDate },
    //               productId: { $in: productIds.map(id => mongoose.Types.ObjectId(id)) }
    //             }
    //           },
    //           {
    //             $group: {
    //               _id: "$productId",
    //               stockInDocs: { $push: "$$ROOT" },
    //               totalStockIn: { $sum: "$quantity" }
    //             }
    //           },
    //           {
    //             $lookup: {
    //               from: "StockOut",
    //               localField: "_id",
    //               foreignField: "productId",
    //               as: "stockOutData"
    //             }
    //           },
    //           {
    //             $unwind: {
    //               path: "$stockOutData",
    //               preserveNullAndEmptyArrays: true
    //             }
    //           },
    //           {
    //             $group: {
    //               _id: "$_id",
    //               stockInDocs: { $first: "$stockInDocs" },
    //               totalDifference: { $sum: { $subtract: ["$totalStockIn", { $ifNull: ["$stockOutData.quantity", 0] }] } }
    //             }
    //           },
    //           {
    //             $unwind: "$stockInDocs"
    //           },
    //           {
    //             $project: {
    //               _id: "$stockInDocs._id",
    //               productId: "$_id",
    //               name: "$stockInDocs.name",
    //               department: "$stockInDocs.department",
    //               prevQuantity: "$stockInDocs.prevQuantity",
    //               quantity: "$stockInDocs.quantity",
    //               price:"$stockInDocs.price",
    //               createdAt: "$stockInDocs.createdAt",
    //               expiry: "$stockInDocs.expiry",
    //               totalDifference: 1
    //             }
    //           }
    //         ])       
    //         .then(response=>{
    //             res.status(200).send({msg:"success",result:response})
    //         })       

    //     }
        
    // }
    async getPrevStockInInfo(req, res) {
      console.log(req.body);
      if (!req.body.start || !req.body.end || !req.body.department || !req.body.productId) {
          res.status(400).send("Bad Request");
      } else {
          var startDate = new Date(req.body.start);
          var endDate = new Date(req.body.end);
          const productIds = req.body.productId;
          const department = req.body.department; // Assuming department is provided as a string
  
          StockIn.aggregate([
              {
                  $match: {
                      createdAt: { $gte: startDate, $lte: endDate },
                      productId: { $in: productIds.map(id => mongoose.Types.ObjectId(id)) },
                      department: department // Match by department
                  }
              }, // Comment: Matching documents by department
              {
                  $group: {
                      _id: "$productId",
                      stockInDocs: { $push: "$$ROOT" },
                      totalStockIn: { $sum: "$quantity" }
                  }
              },
              {
                  $lookup: {
                      from: "StockOut",
                      localField: "_id",
                      foreignField: "productId",
                      as: "stockOutData"
                  }
              },
              {
                  $unwind: {
                      path: "$stockOutData",
                      preserveNullAndEmptyArrays: true
                  }
              },
              {
                  $group: {
                      _id: "$_id",
                      stockInDocs: { $first: "$stockInDocs" },
                      totalDifference: { $sum: { $subtract: ["$totalStockIn", { $ifNull: ["$stockOutData.quantity", 0] }] } }
                  }
              },
              {
                  $unwind: "$stockInDocs"
              },
              {
                  $project: {
                      _id: "$stockInDocs._id",
                      productId: "$_id",
                      name: "$stockInDocs.name",
                      department: "$stockInDocs.department",
                      prevQuantity: "$stockInDocs.prevQuantity",
                      quantity: "$stockInDocs.quantity",
                      price: "$stockInDocs.price",
                      createdAt: "$stockInDocs.createdAt",
                      expiry: "$stockInDocs.expiry",
                      totalDifference: 1
                  }
              }
          ])
          .then(response => {
              res.status(200).send({ msg: "success", result: response });
          });
      }
  }
  
    async getStockInDocNo(req,res){
        StockIn.find({},{docNo:1}).sort({createdAt:-1}).limit(1)
        .then(response=>{
            res.status(200).send({msg:'success',result:response})
        })
    }
    async getStockOutDocNo(req,res){
        StockOut.find({},{docNo:1}).sort({createdAt:-1}).limit(1)
        .then(response=>{
            res.status(200).send({msg:'success',result:response})
        })
    }
 
    async getMonthlyReport(req,res){
        let d1 = date.parse(req.body.from, 'YYYY/MM/DD');
        let d2 = date.parse(req.body.to, 'YYYY/MM/DD'); //format - '2023/01/10'
        console.log(d2,d3)
        StockOut.aggregate([
            {
              $match: {
                $and: [
                  { createdAt: { $gt: d1 } },
                  { createdAt: { $lt: d2 } }
                ]
              }
            },
            {
              $lookup: {
                from: "locations",
                localField: "location",
                foreignField: "_id",
                as: "location"
              }
            }
          ])
        .then(response=>{
            res.status(200).send({msg:"success",result:response})
        })
    }
//,$and:[{createdAt:{$gt:"2022-11-29T18:30:00.000Z"}},{createdAt:{$lt:"2022-12-31T18:30:00.000Z"}} ]
    async getStockReport(req,res){
        if(!req.body.start || !req.body.end || !req.body.selectedLocation){
            res.status(400).send("Bad Request")
        }else{
            StockOut.find({
                createdAt: {
                  $gte: new Date(req.body.start),
                  $lte: new Date(req.body.end)
                },
                location: req.body.selectedLocation._id
              })    
              .populate('productId')          
            .then(response=>{
                res.status(200).send({msg:"success",result:response})
            })
        }
        
        // let d1 = date.parse(req.body.from, 'YYYY/MM/DD');
        // let d2 = date.parse(req.body.to, 'YYYY/MM/DD'); //format - '2023/01/10'
        // console.log(d1,d2)
        // StockOut.find({location:mongoose.Types.ObjectId(req.body.locationId),trainerName:req.body.trainerName,$and:[{createdAt:{$gt:d1}},{createdAt:{$lt:d2}}]})
        // .then(response=>{
        //     res.status(200).send({msg:"success",result:response})
        // })
    }

    async getStockAllStockOut(req,res){
        if(req.body.search){
            StockOut.find({docNo:req.body.search}).populate('location').populate('productId')
            .then(response=>{
                res.status(200).send({msg:"success",result:response})
            })
        }else{
            StockOut.find({}).populate('location').populate('productId')
            .then(response=>{
                res.status(200).send({msg:"success",result:response})
            })
        }
    }

    async getDocumentStockOut(req,res){
        console.log(req.body.docNo)
        StockOut.aggregate([
            // {
            //     $match:req.body.docNo?{docNo:parseInt(req.body.docNo)}:{}
            // },
            // {
            //     $sort:{docNo:-1}
            // },
            // {
            //     $group:{
            //     _id:{
            //     docNo:"$docNo",
            //     },
            //     trainerName:{$push:"$trainerName"},
            //     createdAt:{$push:"$createdAt"}
                
            // }}  
            {
                $group: {
                  _id: "$docNo",
                  stockouts: { $push: "$$ROOT" }
                }
              },
              {
                $sort: {
                  "_id": -1 // Sorting by docNo in ascending order
                }
              }
        ])
        .then(response=>{
            res.status(200).send({msg:"success",result:response})
        })
    }

    async getStockDoucments(req,res){
        console.log(req.body.name)
        if(!req.body.name){
            res.status(400).send("Bad Request")
        }else{
            let stockout = await 
            StockOut.find({name:req.body.name}).sort({docNo:-1})

            let stockin = await 
            StockIn.find({name:req.body.name}).sort({docNo:-1})

            res.status(200).send({msg:"success",result:{stockout:stockout,stockin}})
        }
    }

    async getStockoutByDocNo(req,res){
        if(!req.body.docNo){
            res.status(400).send("Bad Request")
        }else{
            let stockout = await StockOut.aggregate([
                {
                    $match:{docNo:parseInt(req.body.docNo)}
                },
                {
                    $sort:{createdAt:-1}
                },
                {
                    $group:{
                        _id:{
                            docNo:"$docNo",
                            },
                            doc:{
                                $push:{
                                    _id:"$_id",
                                    name:"$name",
                                // productType:"$vitamin",
                                // supplierDocNo:"$supplierDocNo",
                                quantity:"$quantity",
                                unit:"$unit",
                                doctorName:"$doctorName",
                                trainerName:"$trainerName",
                                prevQuantity:"$prevQuantity",
                                expiry:"$expiry",
                                date:"$date",
                                "createdAt":"$createdAt",
                                }
                            }
                    // _id:{
                    // docNo:"$docNo",
                    // },
                    // createdAt:{$push:"$createdAt"},
                    // name:{$push:"$name"},
                    // // productType:{$push:"$vitamin"},
                    // // supplierDocNo:{$push:"$supplierDocNo"},
                    // quantity:{$push:"$quantity"},
                    // unit:{$push:"$unit"},
                    // doctorName:{$push:"$doctorName"},
                    // trainerName:{$push:"$trainerName"},
                    // prevQuantity:{$push:"$prevQuantity"},
                    // date:{$push:"$date"},
                    
                }}  
            ])
            res.status(200).send({msg:"success",result:stockout})
        }

    }
    async getStockInByDocNo(req,res){
        if(!req.body.docNo){
            res.status(400).send("Bad Request")
        }else{
            let stockin = await StockIn.aggregate([
                {
                    $match:{docNo:parseInt(req.body.docNo)}
                },
                {
                    $sort:{createdAt:-1}
                },
                {
                    $group:{
                        _id:{
                            docNo:"$docNo",
                            },
                            doc:{
                                $push:{
                                _id:"$_id",
                                name:"$name",
                                // supplier:"$supplier.name",
                                // productType:"$vitamin",
                                // supplierDocNo:"$supplierDocNo",
                                quantity:"$quantity",
                                unit:"$unit",
                                companyName:"$companyName",
                                productType:"$productType",
                                price:"$price",
                                prevQuantity:"$prevQuantity",
                                expiry:"$expiry",
                                "createdAt":"$createdAt",
                                }
                            }
                    // _id:{
                    // docNo:"$docNo",
                    // },
                    // createdAt:{$push:"$createdAt"},
                    // name:{$push:"$name"},
                    // productType:{$push:"$productType"},
                    // supplierDocNo:{$push:"$supplierDocNo"},
                    // supplier:{$push:"$supplier"},
                    // quantity:{$push:"$quantity"},
                    // unit:{$push:"$unit"},
                    // price:{$push:"$price"},
                    // prevQuantity:{$push:"$prevQuantity"},
                    // expiry:{$push:"$expiry"},
                    
                }} 
            ])
            res.status(200).send({msg:"success",result:stockin})
        }

    }

    async currentStockList(req,res){
        Stock.find({}).populate("stockIn").populate("stockOut")
        .populate({ 
            path: 'stockIn',
            populate: {
              path: 'supplier',
              model: 'Supplier'
            } 
         })
        .populate({ 
            path: 'stockOut',
            populate: {
              path: 'location',
              model: 'Location'
            } 
         })

        .then(response=>{
            res.status(200).send({msg:'success',result:response})
        })
    }

   
      
    async testRoute(req,res){
        Stock.findOne({
            "expiryArray": {
              $elemMatch: {
                "expiry": new Date(1638000000000)
              }
            }
          })
          .then(response=>{
            res.send(response)
          })
          
    }
      
    // async stockOuts(req, res,next) {
    //     console.log("Stockout start--------------------------------- body",req.body)
    //     // const stockOuts = req.body.stockOuts;
    //     // const allStockOuts = [];
    //     for (let i = 0; i < stockOuts.length; i++) {
    //       const { unit, productName, productId, docNo, locationId, quantity, date, trainerName, doctorName, locationName,expiry,price,locationObject } = stockOuts[i];
          
      
    //       if (!unit || !productName || !productId || !docNo || !locationId || !date || !trainerName || !doctorName) {
    //         res.status(400).send("Bad Request");
    //         return;
    //       }
      
    //       let parsedQuantity = parseInt(quantity);
    //       let newExpiryArray = []
    //       let totalQuantity = 0
    //       let stockIndoc = null
    //       let existingStock = null
    //       let newStock = null;
    //       // If the parsed quantity is positive, convert it to negative
    //       if (parsedQuantity > 0) {
    //         parsedQuantity = -parsedQuantity;
    //       }
    //       if(!expiry){
    //         //new stock
    //         newStock = new Stock({
    //             name:productName,
    //             product:mongoose.Types.ObjectId(productId),
    //             totalQuantity:parsedQuantity,
    //             expiryArray:[],
    //         })
    //       }else{
    //         existingStock = await Stock.findOne({
    //         name:productName,
    //         "expiryArray": {
    //         $elemMatch: {
    //           "expiry": new Date(expiry)
    //         }
    //       }});
    //         stockIndoc  = await StockIn.findOne({name:productName}).sort({createdAt:-1})
    //       }


    //       if (existingStock) {
    //         // Create a new expiry array object if it exist
    //         if(expiry){
    //             newExpiryArray = existingStock.expiryArray.map(item=>{
    //                 console.log(item.expiry,new Date(expiry))
    //                 if(item.expiry.toString()===new Date(expiry).toString()){
    //                     item.prevQuantity = item.quantity
    //                     item.quantity = item.quantity - quantity    
    //                 }
    //                 return item
    //             });
    //         }
    //         console.log("Existing Stock-----StockInDoc",existingStock,stockIndoc)
    //       } 
      
    //       // Create a new stock-out record
    //       const newStockOut = new StockOut({
    //         name: productName,
    //         docNo,
    //         location: locationId,
    //         locationObject,
    //         quantity: quantity,
    //         date,
    //         trainerName,
    //         doctorName,
    //         unit,
    //         productId:mongoose.Types.ObjectId(productId),
    //         locationName,
    //         expiry:expiry?new Date(expiry):null,
    //         stockInPrice:stockIndoc?stockIndoc.price:0,
    //         prevQuantity: existingStock ? existingStock.totalQuantity : 0,
    //         // price:parseInt(price)
    //         price :parseFloat(price)
    //       });
      
    //       const stockOutResponse = await newStockOut.save();
    //       console.log("stockout response------",stockOutResponse)
    //       if(!expiry && newStock){
    //         newStock.stockOut = [stockOutResponse._id]
    //         let newStockAdd = await newStock.save()
    //         console.log("new stock added-----",newStockAdd)

    //       }else{
    //         newExpiryArray.map(item=>{
    //             totalQuantity = totalQuantity + item.quantity
    //         })
    //         const stockUpdate = await Stock.updateOne({product:mongoose.Types.ObjectId(productId)},{$set:{expiryArray:newExpiryArray,totalQuantity},$push:{stockOut:stockOutResponse._id}})
    //         console.log("currentSTockupdate-----",stockUpdate)
    //       }
    //       allStockOuts.push(stockOutResponse);
    //     }
      
    //     res.status(200).send({ msg: 'success', result: allStockOuts });
    //   }
//     async stockOuts(req, res) {
//         let { docNo, memberId, member, productId, productName,quantity, date,expiry} = req.body;
    
      
//         if (!docNo || !memberId || !member || !productId || !productName || !quantity || !date || !expiry ) {
//             res.status(400).send({ msg: "fill all required fields" });
//         } else {
//             quantity = parseInt(quantity)
    
//             let stockFind = await Stock.findOne({ product: mongoose.Types.ObjectId(productId) })
    
//             console.log("stockfind", stockFind)
//             if (stockFind) {
//                 const newStockOut = new StockOut({
//                     docNo,
//                     memberId,
//                     member,
//                     productId,
//                     name: req.body.productName,
//                     quantity,
//                     date,
//                     expiry,
//                     prevQuantity: stockFind.expiryArray.prevQuantity
//                 })
//                 const stockOutResponse = await newStockOut.save()
    
//                 let newExpiryArray = []
//                 if (stockFind.expiryArray.length > 0) {
//                     newExpiryArray = stockFind.expiryArray.map((i, index) => {
//                         if (moment.parseZone(i.expiry).local().format("DD/MM/YY") === moment.parseZone(expiry).local().format("DD/MM/YY")) {
//                             i.prevQuantity = i.quantity
//                             i.quantity = i.quantity - quantity;
//                         }
//                         return i;
//                     })
//                     console.log("newexparray", newExpiryArray)
//                 }
    
//                 let totalQuantity = 0
//                 newExpiryArray.map(i => {
//                     totalQuantity = totalQuantity + i.quantity
//                 })
    
//                 // update Stock in code
//                 const stockUpdate = await Stock.updateOne({ product: mongoose.Types.ObjectId(productId) }, { $set: { expiryArray: newExpiryArray, totalQuantity }, $push: { stockOut: stockOutResponse._id } })
//                 console.log(stockUpdate, 'stockUpdate')
//                 res.status(200).send({ msg: 'Product stock out successfully', result: stockOutResponse })
//             } else {
//                 res.status(404).send({ msg: 'Product not found in stock' })
//             }
//         }
//     
//     }
      

    async getSummaryStockout(req,res){
        if(!req.body.start || !req.body.end){
            res.status(400).send("Bad Request")
        }else{
            const startDate = new Date(req.body.start);
            const endDate = new Date(req.body.end);
            const locations = req.body.selectedLocation; // Assuming locations is an array of location names
            
            StockOut.aggregate([
              {
                $match: {
                  createdAt: {
                    $gte: startDate,
                    $lte: endDate
                  },
                  locationName: {
                    $in: locations
                  }
                }
              },
              {
                $group: {
                  _id: "$locationName",
                  total: {
                    $sum: {
                      $multiply: ["$quantity", "$price"]
                    }
                  },
                  documents: {
                    $push: "$$ROOT"
                  }
                }
              }
            ])
            
              .then(response=>{
                res.status(200).send({msg:"success",result:response})
              })
        }

          
    }


    async discardItems(req, res) {
   
        const { unit, productName, productId, docNo, department, quantity, date, memberName, expiry, price, stockOutId } = req.body;
    
        if (!docNo || !department || !productId || !quantity || !expiry || !memberName) {
            res.status(400).send("Bad Request");
            return;
        }
    
        let parsedQuantity = parseInt(quantity);
        let newExpiryArray = []
        let totalQuantity = 0
        let stockIndoc = null
        let existingStock = null
        let newStock = null;
        // If the parsed quantity is positive, convert it to negative
        if (parsedQuantity > 0) {
            parsedQuantity = -parsedQuantity;
        }
        if (!expiry) {
            //new stock
            newStock = new Stock({
                name: productName,
                product: mongoose.Types.ObjectId(productId),
                totalQuantity: parsedQuantity,
                expiryArray: [],
                department: department
            })
        } else {
            existingStock = await Stock.findOne({
                name: productName,
                department: department,
                "expiryArray": {
                    $elemMatch: {
                        "expiry": new Date(expiry)
                    }
                }
            });
            stockIndoc = await StockIn.findOne({ name: productName, department: department }).sort({ createdAt: -1 })
        }
    
        if (existingStock) {
            // Create a new expiry array object if it exist
            if (expiry) {
                newExpiryArray = existingStock.expiryArray.map(item => {
                    console.log(item.expiry, new Date(expiry))
                    if (item.expiry.toString() === new Date(expiry).toString()) {
                        item.prevQuantity = item.quantity
                        item.quantity = item.quantity - quantity
                    }
                    return item
                });
            }
            console.log("Existing Stock-----StockInDoc", existingStock, stockIndoc)
        }
    
        // Create a new stock-out record
        const newStockOut = new Discard({
            name: productName,
            docNo,
            department,
            quantity,
            date,
            memberName,
            unit,
            productId: mongoose.Types.ObjectId(productId),
            expiry: expiry ? new Date(expiry) : null,
            stockInPrice: stockIndoc ? stockIndoc.price : 0,
            prevQuantity: existingStock ? existingStock.totalQuantity : 0,
            price: parseFloat(price)
        });
    
        const DiscardResponse = await newStockOut.save();
        console.log("DiscardResponse response------", DiscardResponse)
        if (!expiry && newStock) {
            newStock.stockOut = [DiscardResponse._id]
            let newStockAdd = await newStock.save()
            console.log("new stock added-----", newStockAdd)
    
        } else {
            newExpiryArray.map(item => {
                totalQuantity = totalQuantity + item.quantity
            })
            const stockUpdate = await Stock.updateOne({ product: mongoose.Types.ObjectId(productId), department: department }, { $set: { expiryArray: newExpiryArray, totalQuantity }, 
            $push: { Discard: DiscardResponse._id } })
            console.log("currentSTockupdate-----", stockUpdate)
        }
    
        res.status(200).send({ msg: 'success', result: DiscardResponse });
    }

    async deleteDiscardItems(req, res) {
        try {
            const { discardId, productName, expiry, quantity } = req.body;
    
            // Check if the discard record exists
            const existingDiscard = await Discard.findById(discardId);
            if (!existingDiscard) {
                throw new Error("Discard record not found");
            }
    
            // Delete the discard record
            await Discard.deleteOne({ _id: discardId });
    
            // Find the stock record
            const stock = await Stock.findOne({ name: productName });
            if (!stock) {
                return res.status(404).send({ msg: "error", result: "Stock not found" });
            }
    
            // Find the expiry array item for the given expiry date
            const expiryDate = new Date(expiry);
            const expiryArrayItem = stock.expiryArray.find(item => new Date(item.expiry).getTime() === expiryDate.getTime());
            if (expiryArrayItem) {
                // Increase the quantity by the deleted discard quantity
                expiryArrayItem.quantity += quantity;
                stock.markModified('expiryArray');  // Mark the expiryArray as modified to ensure updates
    
                // Update the total quantity in the stock record
                stock.totalQuantity += quantity;
    
                // Remove the discard reference if there is a reference array
                if (stock.discard) {
                    stock.discard = stock.discard.filter(id => id.toString() !== discardId.toString());
                }
    
                // Save the updated stock record
                await stock.save();
                res.status(200).send({ msg: "success", result: "Successfully removed discard record and updated stock" });
            } else {
                res.status(404).send({ msg: "error", result: "Expiry array item not found" });
            }
        } catch (error) {
            console.error("Error deleting discard record:", error);
            res.status(500).send({ msg: "error", result: "Internal Server Error" });
        }
    }
      

}

const productController = new ProductController();
module.exports=productController;