const express = require("express")
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const {PDFNet} = require("@pdftron/pdfnet-node")
const PORT = process.env.PORT || 3002
const mongoose = require('mongoose')
require('dotenv').config()

const path = require('path');
const { convertWordFiles } = require("convert-multiple-files-ul")
const fs = require('fs');
const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

mongoose.connect(process.env.MONGODB)
.then(res=>{
    console.log("connection successsfull")
})
.catch(err=>{
    console.log(err)
})
// const bodyParser = require('body-parser');



const userRouter = require('./router/userRouter')
const productRouter = require('./router/productRouter')
const supplierRouter = require("./router/memberRouter")
const locationRouter = require("./router/locationRouter")
const stockRouter = require("./router/stockRouter")
const orderRouter = require("./router/orderRouter")

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/member',supplierRouter)
app.use('/api/location',locationRouter)
app.use('/api/stock',stockRouter)
app.use('/api/order',orderRouter)


// async function main() {
//     const ext = '.pdf'
//     const inputPath = path.join(__dirname, '/resources/hassan.docx');
//     const outputPath = path.join(__dirname, `/resources/example${ext}`);

//     // Read file
//     const docxBuf = await fs.readFile(inputPath);

//     // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
//     let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);
    
//     // Here in done you have pdf file which you can save or transfer in another stream
//     await fs.writeFile(outputPath, pdfBuf);
// }

// main().catch(function (err) {
//     console.log(`Error converting file: ${err}`);
// });
// app.get('/', async (req,res)=>{
//         // Return promise => convertWordFiles(path of the file to be converted, convertTo, outputDir)
//         // const pathOutput = await convertWordFiles(path.resolve(__dirname, '/hassan.docx'), 'pdf', path.resolve(__dirname));
//         // console.log(pathOutput);
//         const extend = '.pdf'
//         const FilePath = path.join(__dirname, './hassan.docx');
//         const outputPath = path.join(__dirname, `./example${extend}`);
         
//         // Read file
//         const enterPath = fs.readFileSync('./hassan.docx');
//         // Convert it to pdf format with undefined filter (see Libreoffice doc about filter)
//         libre.convert(enterPath, extend, undefined, (err, done) => {
//             if (err) {
//               console.log(`Error converting file: ${err}`);
//             }
            
//             // Here in done you have pdf file which you can save or transfer in another stream
//             fs.writeFileSync('./', done);
//         });
// })
// const PDFNetEndpoint = (main, pathname, res) => {
//     PDFNet.runWithCleanup(main)
//     .then(() => {
//       PDFNet.shutdown();
//       fs.readFile(pathname, (err, data) => {
//         if (err) {
//           res.statusCode = 500;
//           res.end(`Error getting the file: ${err}.`);
//         } else {
//           const ext = path.parse(pathname).ext;
//           res.setHeader('Content-type', mimeType[ext] || 'text/plain');
//           res.end(data);
//         }
//       });
//     })
//     .catch((error) => {
//       res.statusCode = 500;
//       res.end(error);
//     });
// };
// app.get('/convert/:filename', (req, res) => {
//     const filename = 'hassan'
//     let ext = path.parse(filename).ext;
  
//     const inputPath = path.resolve(__dirname, './', 'hassan.docx');
//     const outputPath = path.resolve(__dirname, './', `'${filename}'.pdf`);
  
//     if (ext === '.pdf') {
//       res.statusCode = 500;
//       res.end(`File is already PDF.`);
//     }
  
//     const main = async () => {
//       const pdfdoc = await PDFNet.PDFDoc.create();
//       await pdfdoc.initSecurityHandler();
//       await PDFNet.Convert.toPdf(pdfdoc, inputPath);
//       pdfdoc.save(
//         `${pathname}'${filename}'.pdf`,
//         PDFNet.SDFDoc.SaveOptions.e_linearized,
//       );
//       ext = '.pdf';
//     };
  
//     PDFNetEndpoint(main, outputPath, res);
//   });

app.listen(PORT,()=>{
    console.log("server started on 3002")
})