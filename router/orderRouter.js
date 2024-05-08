const express = require ('express');
const orderController = require("../controllers/orderController")
const router = express.Router();

// router.post('/CreateOrder',orderController.CreateOrder)
// router.get('/getAllOrder/:id',orderController.getAllOrder)
// router.put('/updateOrder/:id',orderController.updateOrder)
// router.delete('/deleteOrder/:id',orderController.deleteOrder)

router.post('/CreateOrder',orderController.CreateOrder)
router.get('/getAllOrder/:id',orderController.getAllOrder)
router.get('/getDetailsOrders',orderController.getDetailsOrders)
router.put('/updateOrder/:id',orderController.updateOrder)

module.exports = router;


