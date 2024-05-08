const jwt = require("jsonwebtoken");

module.exports = isAdminAuth=(req,res,next)=>{
    if(!req.headers.token){
        res.status(402).send("Unauthorized Access")
    }else{
        decode = jwt.verify(req.headers.token, process.env.TOKEN);
        if(!decode.userName || !decode._id ){
            res.status(402).send("Unauthorized Access")
        }else{
            req.userDetails = decode
            next()
        }

    }
}