const express = require('express')
const router = express.Router();
const stockController = require('../controllers/stockController')
const isAdminAuth = require("../middlewares/isAdminAuth")
const isUserAuth = require("../middlewares/isUserAuth")


router.get('/getAllStocks/:departmentName',stockController.getAllStocks)
// router.get('/getAllStocksNew',stockController.getAllStocksNew)
router.post('/stockIn',isUserAuth,stockController.stockIn) 
router.post('/stockOuts',isUserAuth,stockController.stockOuts)
 
router.get('/testRoute',stockController.testRoute)
router.post('/getDocumentStockOut',isUserAuth,stockController.getDocumentStockOut)
router.post('/getStockDoucments',isUserAuth,stockController.getStockDoucments)
router.post('/getStockoutByDocNo',isUserAuth,stockController.getStockoutByDocNo)
router.post('/getStockInByDocNo',isUserAuth,stockController.getStockInByDocNo)
router.post('/deleteStockIn',isUserAuth,stockController.deleteStockIn)
router.post('/deleteStockOut',isUserAuth,stockController.deleteStockOut)
router.post('/getStockAllStockOut',isUserAuth,stockController.getStockAllStockOut)
router.post('/getPrevStockInInfo',isUserAuth,stockController.getPrevStockInInfo)
router.post('/getPrevStockOutInfo',isUserAuth,stockController.getPrevStockOutInfo)

router.get('/getStockInDocNo',isUserAuth,stockController.getStockInDocNo)
router.get('/getStockOutDocNo',isUserAuth,stockController.getStockOutDocNo)
router.post('/getMonthlyReport',isUserAuth,stockController.getMonthlyReport)
router.post('/getStockReport',isUserAuth,stockController.getStockReport)


router.get('/currentStockList',isUserAuth,stockController.currentStockList)
router.post('/getSummaryStockout',isUserAuth,stockController.getSummaryStockout)

// ===============================Abdur Rahim Discard=============================================================
router.post('/discardItems',isUserAuth,stockController.discardItems)
router.post('/deleteDiscardItems',isUserAuth,stockController.deleteDiscardItems)

// ----------------------------- Abdur Razzaque Changes----------------------
router.post('/stockInUpdateQuantity/:id',stockController.stockInUpdateQuantity)
router.post('/stockOutUpdateQuantity/:id',stockController.stockOutUpdateQuantity)
router.delete('/stockInDelete/:id',stockController.stockInDelete)
router.delete('/stockOutDelete/:id',stockController.stockOutDelete)
router.put('/updatestockIn/:name',stockController.updatestockIn)

// router.delete('/deleteStockinfo/:name',stockController.deleteStockinfo)
module.exports=router; 