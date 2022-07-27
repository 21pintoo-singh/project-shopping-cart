const productModel=require("../models/productModel")
const validator=require("../utility/validation.js")
const aws=require("../utility/awsconfig")

//var nameRegex=/^[a-zA-Z][a-zA-Z\\s]+$/
//var nameRegex=/^[a-zA-Z]+(\s[a-zA-Z]+)?$/
var nameRegex=/^[a-zA-Z\s]*$/
var priceRegex=/^[1-9]\d*(\.\d+)?$/
var installmentRegex=/\d/

const createProduct=async (req,res)=>{
  try {
    let data=req.body
    let {title,description,price,currencyId,currencyFormat,style,availableSizes,installments}=data
      
    let objectCreate={}

    if(!validator.isValidBody(data))
    return res.status(400).send({status:false,message : "Please enter some details in the request body"})

    if(!title)
    return res.status(400).send({status:false,message:"title field is Required"})

    let findtitle = await productModel.findOne({title:title})
    if(findtitle)
    return res.status(400).send({status:false, message:"This title is already exists"})

    if(nameRegex.test(title)==false)
    return res.status(400).send({status : false, message :"you entered a invalid Title"})

    objectCreate.title=title

    if(!description)
    return res.status(400).send({status:false,message:"description field is Required"})

    if(nameRegex.test(description)==false)
    return res.status(400).send({status : false, message :"you entered a invalid description"})

     objectCreate.description=description

    if(!price)
    return res.status(400).send({status:false, message:"Price field is Required"})

    // if(typeof price!="number")
    // return res.status(400).send({status:false, message:"Price should be of Number"})

    if(priceRegex.test(price)==false)
    return res.status(400).send({status : false, message :"you entered a invalid price"})

    objectCreate.price=price

    if(!currencyId)
    return res.status(400).send({status:false, message:"currencyId field is Required"})

    let checkCurrencyId="INR"
    if(currencyId!=checkCurrencyId)
    return res.status(400).send({status : false, message :"you entered a invalid currencyId---> currencyId should be INR"})

    objectCreate.currencyId=currencyId

    if(!currencyFormat)
    return res.status(400).send({status:false, message:"currencyFormat field is Required"})

    let checkCurrencyFormat="₹"
    if(currencyFormat!=checkCurrencyFormat)
    return res.status(400).send({status : false, message :"you entered a invalid currencyFormat--> currencyFormat should be ₹"})

    objectCreate.currencyFormat=currencyFormat

    let image=req.files
    if(!image || image.length==0)
    return res.status(400).send({status:false,message:"Profile Image field is Required"})

    let productImage=await aws.uploadFile(image[0])

    objectCreate.productImage=productImage

    if(style){
        if(nameRegex.test(style)==false)
        return res.status(400).send({status:false,message:"STyle to enterd is invalid"})

        objectCreate.style=style
    }

    let checkSizes=["S", "XS","M","X", "L","XXL", "XL"]

    if(!availableSizes)
    return res.status(400).send({status:false,message:"Available Sizes field is Required"})

    let arrayOfSizes=availableSizes.split(" ")

    for(let i=0;i<arrayOfSizes.length;i++){
        if(checkSizes.includes(arrayOfSizes[i]))
        continue;
        else
        return res.status(400).send({status:false,message:"Sizes should in this ENUM only S/XS/M/X/L/XXL/XL"})
    }

    objectCreate.availableSizes=arrayOfSizes

    if(installments){
        if(installmentRegex.test(installments)==false)
        return res.status(400).send({status:false,message:"Installment  you entered is invalid"})

        objectCreate.installments=installments
    }

    let productCreate= await productModel.create(objectCreate)
    return res.status(201).send({status:true,message:"Document is created successfully",data:productCreate})

}

catch(err){
    return res.status(500).send({status:false,message:err.message})
}

}


module.exports={createProduct}

