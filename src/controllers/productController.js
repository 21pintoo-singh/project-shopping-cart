const productModel=require("../models/productModel")
const validator=require("../utility/validation.js")
const aws=require("../utility/awsconfig")
const mongoose=require('mongoose')

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

    let arrayOfSizes=availableSizes.trim().split(",")

    for(let i=0;i<arrayOfSizes.length;i++){
        if(checkSizes.includes(arrayOfSizes[i].trim()))
        continue;
        else
        return res.status(400).send({status:false,message:"Sizes should in this ENUM only S/XS/M/X/L/XXL/XL"})
    }
    let newSize=[]
    for(let j=0;j<arrayOfSizes.length;j++){
        if(newSize.includes(arrayOfSizes[j].trim()))
        continue;
        else
        newSize.push(arrayOfSizes[j].trim())
    }

    objectCreate.availableSizes=newSize

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

let filterProduct= async (req,res)=>{
    let queryData=req.query
    if(Object.keys(queryData).length==0){
        let filterData= await productModel.find({isDeleted:false})
        return res.status(200).send({status:true,message:"Successful",data:filterData})
    }

    let objectFilter={isDeleted:false}

    let size=queryData.size
    
    if(size){
        let checkSizes=["S", "XS","M","X", "L","XXL", "XL"]

        let arraySize=size.split(",")

        for(let i=0;i<arraySize.length;i++){
            if(checkSizes.includes(arraySize[i]))
            continue;
            else
            return res.status(400).send({status:false,message:"Sizes should in this ENUM only S/XS/M/X/L/XXL/XL"})
        }
        objectFilter.availableSizes={}
        objectFilter.availableSizes.$in=arraySize

    }

    let name=queryData.name
    if(name){
        if(!validator.isValid(name))
        return res.status(400).send({status:false,message:"Name should not be empty"})

        if(nameRegex.test(name)==false)
        return res.status(400).send({status:false,message:"You entered invalid Name"})

        objectFilter.title={}
        objectFilter.title.$regex=name
        objectFilter.title.$options="i"
    }
    let priceArray=[]

    let priceGreaterThan=queryData.priceGreaterThan
    if(priceGreaterThan){
        if(!validator.isValid(priceGreaterThan))
        return res.status(400).send({status:false,message:"Name should not be empty"})
    
        if(priceRegex.test(priceGreaterThan)==false)
        return res.status(400).send({status:false,message:"You entered invalid priceGreaterThan"})
    
        objectFilter.price={}
        objectFilter.price.$gt=Number(priceGreaterThan)
    }

    let priceLessThan=queryData.priceLessThan
    if(priceLessThan){
        if(!validator.isValid(priceLessThan))
        return res.status(400).send({status:false,message:"Name should not be empty"})
    
        if(priceRegex.test(priceLessThan)==false)
        return res.status(400).send({status:false,message:"You entered invalid priceLessThan"})

        let objectKeys=Object.keys(objectFilter)
      
            if(objectKeys.includes("price")){
                objectFilter.price.$lt=Number(priceLessThan)
            } 
            else{
            objectFilter.price={}
            objectFilter.price.$lt=Number(priceLessThan)
            console.log(typeof (objectFilter.price.$lt))
           }

        //objectFilter.$lt=priceLessThan
        //priceArray.push({$lt:priceLessThan})
    }
    console.log(objectFilter)
    let sortedBy=queryData.sortedBy

    if(sortedBy){
        if(!(sortedBy=="1" || sortedBy=="-1"))
        return res.status(400).send({status:false,message:"You entered an invalid input sorted By can take only two Inputs 1 OR -1"})

    }

    let findFilter= await productModel.find(objectFilter).sort({price:sortedBy})

    if(findFilter.length==0)
    return res.status(404).send({status:false,message:"No product Found"})

    return res.status(200).send({status:true,message:"successful",data:findFilter})
}

let getById= async (req,res)=> {
    let productId=req.params.productId

    if(!mongoose.isValidObjectId(productId))
    return res.status(400).send({status:false,message:"You entered an invalid ProductId"})

    let findId= await productModel.findOne({_id:productId})
    if(!findId)
    return res.status(404).send({status:false,message:"No product found"})

    return res.status(200).send({status:true,message:"success",data:findId})

}

let updateProduct= async (req,res) =>{
 try{
    let id=req.params.productId
    if(!mongoose.isValidObjectId(id))
    return res.status(400).send({status:false,message:"You entered an invalid productId"})

    let findUpdate= await productModel.findOne({_id:id})
    if(!findUpdate)
    return res.status(404).send({status:false,message:"No product Found"})

    if(findUpdate.isDeleted==true)
    return res.status(400).send({status:false,message:"This Product is Already deleted"})

    let updateData=req.body

    let objectUpdate={}

    let title=updateData.title
    if(title){
        title=title.trim()
        if(!validator.isValid(title))
        return res.status(400).send({status:false, message:"Title field is Empty"})

        if(nameRegex.test(title)==false)
        return res.status(400).send({status:false,message:"You entered an Invalid Title"})

        let findTitle= await productModel.findOne({title:title})
        if(findTitle){
            if(findTitle._id!=id)
        return res.status(400).send({status:false,message:"title is already exists"})
        }
        
        objectUpdate.title=title

    }

    let description=updateData.description
    if(description){

        if(nameRegex.test(description)==false)
        return res.status(400).send({status:false,message:"You entered an Invalid description"})
        
        objectUpdate.description=description

    }

    let price=updateData.price
    if(price){

    if(priceRegex.test(price)==false)
    return res.status(400).send({status : false, message :"you entered a invalid price"})
    
    objectUpdate.price=price
    }

    let currencyId=updateData.currencyId

    if(currencyId){
    let checkCurrencyId="INR"

     if(currencyId!=checkCurrencyId)
    return res.status(400).send({status : false, message :"you entered a invalid currencyId---> currencyId should be INR"})

    objectUpdate.currencyId=currencyId
    }

    let currencyFormat=updateData.currencyFormat

    if(currencyFormat){

    let checkCurrencyFormat="₹"

    if(currencyFormat!=checkCurrencyFormat)
    return res.status(400).send({status : false, message :"you entered a invalid currencyFormat--> currencyFormat should be ₹"})

    objectUpdate.currencyFormat=currencyFormat
    }


    let image=req.files
    if(image){
        if(image.length==0)
    return res.status(400).send({status:false,message:"Profile Image field is Required"})

    let productImage=await aws.uploadFile(image[0])

    objectUpdate.productImage=productImage
    }

    let style=updateData.style

    if(style){
        if(nameRegex.test(style)==false)
        return res.status(400).send({status:false,message:"Style to enterd is invalid"})

        objectUpdate.style=style
    }

    let availableSizes=updateData.availableSizes

    if(availableSizes){
        let checkSizes=["S", "XS","M","X", "L","XXL", "XL"]


    let arrayOfSizes=availableSizes.trim().split(",")

    for(let i=0;i<arrayOfSizes.length;i++){
        if(checkSizes.includes(arrayOfSizes[i].trim()))
        continue;
        else
        return res.status(400).send({status:false,message:"Sizes should in this ENUM only S/XS/M/X/L/XXL/XL"})
    }
    let updateSize= await productModel.findOne({_id:id}).select({_id:0,availableSizes:1})
    let arraySize=updateSize.availableSizes
    for(let i=0;i<arrayOfSizes.length;i++){
        if(arraySize.includes(arrayOfSizes[i].trim()))
        continue;
        else
        arraySize.push(arrayOfSizes[i].trim())

    }


    objectUpdate.availableSizes=arraySize
   }

   let installments=updateData.installments

    if(installments){
        if(installmentRegex.test(installments)==false)
        return res.status(400).send({status:false,message:"Installment  you entered is invalid"})

        objectUpdate.installments=installments
    }

    let isFreeShipping=updateData.isFreeShipping
    if(isFreeShipping){

        objectUpdate.isFreeShipping=isFreeShipping
    }

    let dataUpdate= await productModel.findOneAndUpdate({_id:id},{$set:objectUpdate,updatedAt:Date.now()},{new:true})
    
    return res.status(200).send({status:true,message:"Data is Updated Successfully",data:dataUpdate})

  }
  catch(err){
    return res.status(500).send({status:false,message:err.message})
  }
}

let deleteProduct= async (req,res)=>{
    let productId=req.params.productId
    if(!mongoose.isValidObjectId(productId))
    return res.status(400).send({status:false,message:"You entered an invalid ProductId"})

    let findDelete= await productModel.findOne({_id:productId})
    if(!findDelete)
    return res.status(404).send({status:false,message:"No product found"})

    if(findDelete){
        if(findDelete.isDeleted==true)
        return res.status(400).send({status:false,message:"This product is Already Deleted.........."})
    }

    let deleteProduct= await productModel.findOneAndUpdate({_id:productId},{$set:{isDeleted:true}},{new:true})

    return res.status(200).send({status:true,message:"Product is deleted successFul"})

}

module.exports={createProduct,filterProduct,getById,updateProduct,deleteProduct}

