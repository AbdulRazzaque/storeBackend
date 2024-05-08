const Order = require("../models/Order")

class OrderController{

    async CreateOrder(req,res,next){
        
         const newOrder = new Order({
            memberId: req.body.memberId,
            memberName: req.body.memberName,
            products: req.body.productId.map(id => ({ productId: id })),
          
            // products: req.body.productId.map(i => ( i )),
            productName: req.body.productName.map(i => ( i )),
            
            requiredQuantity: req.body.requiredQuantity.map(data => (data)),
            status: req.body.status,
            itemnumber:req.body.itemnumber||0
          });
        //   console.log(products)
          // Save the order to the database
          const savedOrder = await newOrder.save();
      
          // Send response back to client 
          res.status(201).json(savedOrder);
        } catch (error) {
          res.status(400).json({ message: "Failed to create order", error: error.message });
    
    }
    
    

        async getAllOrder(req,res){
            
            await Order.findById(req.params.id)
            .populate({ path: 'products.productId', options: { strictPopulate: false } })
        .populate("memberId")
            .then(response=>{
                res.status(200).send({msg:"Sucess",result:response})
            })
        }

        async  getDetailsOrders(req, res, next) {
            try {
                const getDetailsOrders = await Order.find({}).sort({_id:-1})
                    .populate({
                        path: 'memberId',
                        model: 'Member', // Assuming the model name for members is 'Member'
                        select: 'memberName department'
                    })
                    .populate({
                        path: 'products.productId',
                        model: 'Product', // Assuming the model name for products is 'Product'
                        select: 'productName sku'
                    })
                    .select('memberId refNo requiredQuantity products createdAt  status itemnumber');
        
                return res.status(200).send({ msg: "Success", result: getDetailsOrders });
            } catch (error) {
                return next(error);
            }
        }
//         async getDetailsOrders(req, res, next) {
//             try {
//                 const getDetailsOrders = await Order.aggregate([
//                     {
//                         $lookup: {
//                             from: "members", // Assuming the collection name is "members"
//                             localField: "memberId",
//                             foreignField: "_id",
//                             as: "member"
//                         }
//                     },
//                     {
//                         $unwind: "$member"
//                     },
//                     .populate({ path: 'products.productId', options: { strictPopulate: false } })
//                     {
//                         $project: {
//                             _id: 1,
//                             memberId: "$memberId",
//                             memberName: "$memberName",
//                             department: "$member.department",
                            
//                             products: 1,
//                             refNo: 1,
//                             requiredQuantity: 1,
//                             productName: 1,
//                             createdAt:1,
//                             status:1,
//                             itemnumber:1,
                        

//                         }
//                     }
//                 ]);
        
//                 return res.status(200).send({ msg: "Success", result: getDetailsOrders });
//             } catch (error) {
//                 return next(Error(error));
//             }
//         }

        // async getAllOrder(req, res) {
        //     try {
        //         const order = await Order.findById(req.params.id)
        //         .populate({ path: 'products.productId', options: { strictPopulate: false } })
        //             .populate('memberId');
                
        //         if (!order) {
        //             return res.status(404).send({ msg: 'Order not found' });
        //         }
        
        //         res.status(200).send({ msg: 'Success', result: order });
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send({ msg: 'Internal Server Error' });
        //     }
        // }
        
        

        async updateOrder(req, res) {
            const { status } = req.body;
                    
            try {
                await Order.updateOne(
                    { _id: req.params.id },
                    { $set: { status } }
                );
                
                res.status(200).send({ msg: "Success" });
            } catch (error) {
                res.status(500).send({ msg: "Internal Server Error", error: error.message });
            }
        }
        





        async deleteOrder (req,res,next){
            try{
              const deleteOrder =  await Order.findByIdAndRemove({_id:req.params.id})
              if(!deleteOrder){
                return next (new Error ("Somting is wrong"));
              }
              res.json(deleteOrder)
            } catch(error){
                return next (error);
            }

        }
        
}

const orderController = new OrderController();
module.exports = orderController