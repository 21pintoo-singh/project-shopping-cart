const userModel=require('../models/userModel.js')
const productModel=require('../models/productModel.js')
const cartModel=require('../models/cartModel.js')

const mongoose=require('mongoose')

const validator=require('../utility/validation.js')
const { findOneAndUpdate, findByIdAndRemove } = require('../models/userModel.js')

var quantityRegex=/^\d*[1-9]\d*$/

let createCart = async (req,res)=>{
   
    try {

    let userId=req.params.userId

    if(!mongoose.isValidObjectId(userId))
    return res.status(400).send({status:false,message:"You entered an invalid UserId"})

    let findUserId= await userModel.findOne({_id:userId})
    if(!findUserId)
    return res.status(404).send({status:false,message:"No user found"})

    let data=req.body

    let objectCreate={}

     let cartId=data.cartId

    // if(!mongoose.isValidObjectId(cartId))
    // return res.status(400).send({status:false,message:"You entered an invalid cartId"})

    if(!cartId){

    let findCart= await cartModel.findOne({userId:userId})
    if(findCart)
    return res.status(200).send({status:true,message:"cart is created already please enter cartId ........."})
    
    objectCreate.userId=userId

    if(!findCart){
        let productId=data.productId
        if(!productId)
        return res.status(400).send({status:false,message:"productId field is Required..."})

    if(!mongoose.isValidObjectId(productId))
    return res.status(400).send({status:false,message:"You entered an invalid productId"})

    let findProduct= await productModel.findOne({_id:productId,isDeleted:false})
    if(!findProduct)
    return res.status(404).send({status:false, message:"No product found"})

    if(!data.quantity)
    return res.status(400).send({status:false,message:"quantity field is Required..."})

    if(quantityRegex.test(data.quantity)==false)
    return res.status(400).send({status:false,message:"quantity should be above 0.. and should be positive integer only."})

    objectCreate.items=[]
    let objectPush={}
    objectPush.productId=productId
    objectPush.quantity=data.quantity

    objectCreate.items.push(objectPush)
    // objectCreate.items.push({})
    // objectCreate.items[0].productId=productId
    // objectCreate.items[0].quantity=data.quantity


    let totalPrice=(data.quantity)*(findProduct.price)
    objectCreate.totalPrice=totalPrice

    let totalItems=objectCreate.items.length
    objectCreate.toalItems=totalItems

    let createNewCart= await cartModel.create(objectCreate)
    
    return res.status(201).send({status:false,message:"Cart is successfully created",data:createNewCart})

    }
        }

    else {

        if(!mongoose.isValidObjectId(cartId))
        return res.status(400).send({status:false,message:"You entered an invalid cartId"})

       let findCart= await cartModel.findOne({_id:cartId,userId:userId})
       
       if(!findCart) 
       return res.status(404).send({status:false,message:"No cart found"})

       objectCreate.userId=userId

        let productId=data.productId
        if(!productId)
        return res.status(400).send({status:false,message:"productId field is Required..."})

    if(!mongoose.isValidObjectId(productId))
    return res.status(400).send({status:false,message:"You entered an invalid productId"})

    let findProduct= await productModel.findOne({_id:productId,isDeleted:false})
    if(!findProduct)
    return res.status(404).send({status:false, message:"No product found"})

    if(!data.quantity)
    return res.status(400).send({status:false,message:"quantity field is Required..."}) 

    for(let i=0;i<findCart.items.length;i++){
        if(findCart.items[i].productId==productId){
            let checkPrice=findProduct.price
            findCart.items[i].quantity+=Number(data.quantity)
            findCart.totalPrice=findCart.totalPrice+(Number(data.quantity)*checkPrice)
            findCart.totalItems=findCart.items.length

            let updateCartForSameProductId=await cartModel.findOneAndUpdate({_id:cartId,userId:userId},{$set:findCart},{new:true})
            return res.status(200).send({status:true,message:"product added successfully",data:updateCartForSameProductId})

        } else continue;

    }

    
    objectCreate.items=findCart.items
    let pushObject={}
    pushObject.productId=productId
    pushObject.quantity=data.quantity
    objectCreate.items.push(pushObject)
   

    let initialPrice=findCart.totalPrice
    let finalPrice=(data.quantity*findProduct.price)+initialPrice
    objectCreate.totalPrice=finalPrice
    objectCreate.totalItems=objectCreate.items.length



    let addNewCart= await cartModel.findOneAndUpdate({_id:cartId,userId:userId},{$set:objectCreate},{new:true})

    return res.status(200).send({status:false,message:"Cart is added successfully",data:addNewCart})
    }
}

catch(err){
    return res.status(500).send({status:false,message:err.message})
}

}

let deleteCart= async (req,res)=>{
    try {
        let userId = req.params.userId

        let data=req.body

        let objectDelete={}

        if(!mongoose.isValidObjectId(userId))
        return res.status(400).send({status:false,message:"UserId is Invalid"})
        
        let findUser= await userModel.findById(userId)

        if(!findUser) return res.status(404).send({status:false,message:"User does not exists"})

       

       let findCart= await cartModel.findOne({userId:userId})

       if(!findCart)
       return res.status(404).send({status:false,message:"No cart found"})

       let deleteData= await cartModel.findOneAndUpdate({userId:userId},{$set :{items:[],totalPrice:0,totalItems:0}},{new:true})

       if(!deleteData)
       return res.status(404).send({status:false,message:"No cart found........"})
       return res.status(200).send({status:true,message:"success",data:deleteData})

    }

    catch(err){
        return res.status(400).send({status:false,message:err.message})
    }
}

let updateCart= async (req,res)=>{
    try{
        let userId=req.params.userId

        let data=req.body
        let {cartId,productId,removeProduct}=data
        if(!cartId)
        returnres.status(400).send({status:false,message:"cartId is required"})

        if(!mongoose.isValidObjectId(cartId))
        return res.status(400).send({status:false,message:"cartId is invalid"})

        let findCart= await cartModel.findOne({_id:cartId,userId:userId})
        
        if(!findCart)
        return res.status(404).send({status:false,message:"No cart found"})

        if(!productId)
        returnres.status(400).send({status:false,message:"productId is required"})

        if(!mongoose.isValidObjectId(cartId))
        return res.status(400).send({status:false,message:"productId is invalid"})

        let findProduct= await productModel.findById(productId)
        
        if(!findProduct)
        return res.status(404).send({status:false,message:"No product found with respect to this productId"})

        if(!removeProduct){
        return res.status(200).send({status:true,data:findCart})
         }

         else {
            if(removeProduct==0){
                for(let i=0;i<findCart.items.length;i++){
                    if(findCart.items[i].productId==productId){
                        
                        let quantityCalculate=findCart.items[i].quantity
                        let checkPrice=findProduct.price
                        let totalPrice=findCart.totalPrice-(checkPrice*quantityCalculate)

                        findCart.items.splice(i,1)

                        findCart.totalPrice=totalPrice
                        findCart.totalItems=findCart.items.length
                    
                    } else 
                    continue;
                }

            } else if(removeProduct==1){
                for(let j=0;j<findCart.items.length;j++){
                    if(findCart.items[j].productId==productId){
                        
                        let checkQuantity=findCart.items[j].quantity
                        let checkPrice=findProduct.price
                         let totalPrice=findCart.totalPrice-(checkPrice*checkQuantity)

                        // let newQuantity=checkQuantity-1
                        // let totalPrice1=totalPrice-(checkPrice*newQuantity)

                        if(checkQuantity==1){
                            findCart.items.splice(j,1)
                             findCart.totalPrice=totalPrice
                             findCart.totalItems=findCart.items.length
                        } else {
                            let newQuantity=checkQuantity-1
                            let totalPrice1=totalPrice+(checkPrice*newQuantity)
                            findCart.items[j].quantity=newQuantity
                           findCart.totalPrice=totalPrice1
                           findCart.totalItems=findCart.items.length
                        }
                    
                    }
                }
            } else {
                return res.status(400).send({status:false,message:"you have entered an invalid input of removeProduct--> it should be only 0 or 1"})

            }
         }

         let updateData= await cartModel.findOneAndUpdate({_id:cartId,userId:userId},{$set:findCart},{new:true})

         return res.status(200).send({status:false,message:"success",data:updateData})

    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}

let getCart= async (req,res)=>{
    try {let userId=req.params.userId

    if(!mongoose.isValidObjectId(userId))
    return res.status(400).send({status:false,message:"You entered a invalid UserId in the Path params"})

    let findUser=await userModel.findById(userId)
    if(!findUser)
    return res.status(404).send({status:false,message:"User not Found...."})

    let findCart= await cartModel.findOne({userId:userId})

    if(!findCart)
    return res.status(404).send({status:false,message:"No cart exists....."})

    return res.status(200).send({status:true,message:"success",data:findCart})
} 
catch(err) {
    return res.status(500).send({status:false,message:err.message})
}
}


module.exports={createCart,deleteCart,updateCart,getCart}