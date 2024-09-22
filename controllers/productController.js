const mongoose = require('mongoose')
const Product = require("../models/Product")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const _ = require("lodash")
const Stock = require("../models/Stock")
const StockIn =  require("../models/StockIn");
const StockOut = require('../models/StockOut');
class ProductController{
    async getProduct (req,res){
        res.send("home routre user")
    }

//    
async createProduct(req, res) {
    const { itemCode, productName, unit, physicalLocation, sku, lotNumber, manufacturer, supplierName, addModel ,department} = req.body;
    if (!itemCode || !productName || !unit || !physicalLocation || !sku || !manufacturer || !supplierName || !department) {
        res.status(400).send("Data Missing");
    }
     else {
        let newName = `${itemCode} ${productName} ${unit} ${physicalLocation} ${sku} ${lotNumber} ${manufacturer} ${supplierName} ${addModel}`;
        try {
            const existingProduct = await Product.findOne({ itemCode: newName });
            if (existingProduct) {
                res.status(400).send("Product Already Exist");
            }
             else {
                const newProduct = new Product({
                    itemCode: newName,
                    productName,
                    unit,
                    physicalLocation,
                    sku,
                    lotNumber,
                    manufacturer,
                    supplierName,
                    addModel,
                    department

                });
                await newProduct.save();
                res.status(201).send({msg:"Product Created Successfully"});
            }
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    }
}

async updateProduct(req, res, next) {
    const {
        itemCode,
        productName,
        unit,
        physicalLocation,
        sku,
        lotNumber,
        manufacturer,
        supplierName,
        addModel,
        department
    } = req.body;

    if (!itemCode || !productName || !unit || !physicalLocation || !sku || !manufacturer || !supplierName || !department) {
        return res.status(400).send("Data Missing");
    }

    try {
        // Update the product
        const productUpdateResponse = await Product.updateOne(
            { _id: req.params.id },
            { $set: { itemCode, productName, unit, physicalLocation, sku, lotNumber, manufacturer, supplierName, addModel, department } }
        );

        // Update the stock entries based on the product ID
        await Promise.all([
            StockIn.updateMany({ productId: req.params.id }, { $set: { name: productName } }),
            StockOut.updateMany({ productId: req.params.id }, { $set: { name: productName } }),
            Stock.updateMany({ product: req.params.id }, { $set: { name: productName } })
        ]);

        return res.status(200).send({ msg: "Success", result: productUpdateResponse });
    } catch (error) {
        return next(error);
    }
}



    async getAllProducts(req, res) {
        const { departmentName } = req.params;
        let query = {};
        
        if (departmentName && departmentName !== 'All') {
            query = { department: departmentName };
        }
        
        Product.find(query).sort({_id: -1})
            .then(response => {
                res.status(200).send({ msg: "success", result: response });
            })
            .catch(error => {
                res.status(500).send({ msg: "error", error: error.message });
            });
    }
    async deleteProduct(req, res, next) {
        try {
            const product = await Product.findByIdAndRemove(req.params.id);
            if (!product) {
                return next(new Error("Nothing to delete"));
            }
    
            // Remove the product from stockIn
            await StockIn.deleteMany({ productId: req.params.id });

            // Remove the product from stockIn
            await StockOut.deleteMany({ productId: req.params.id });
    
            // Remove the product from Stock
            await Stock.deleteMany({ product: req.params.id });
    
            res.json({ msg: "Product and associated stock entries deleted successfully", product });
        } catch (error) {
            return next(error);
        }
    }

}

const productController = new ProductController();
module.exports=productController;