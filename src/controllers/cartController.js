const userModel=require('../models/userModel.js')
const productModel=require('../models/productModel.js')
const cartModel=require('../models/cartModel.js')

const mongoose=require('mongoose')

const validator=require('../utility/validation.js')

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
    objectCreate.items.push({})
    objectCreate.items[0].productId=productId
    objectCreate.items[0].quantity=data.quantity

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

       let findCart= await cartModel.findOne({_id:cartId})
       
       if(!findCart) 
       return res.status(404).send({status:false,message:"No cart found"})

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

    // for(let i=0;i<findCart.items.length;i++){
    //     if(findCart.items.productId==productId)
    //     findCart.items.quantity=data.quantity
    // }

    let lengthOfItems=findProduct.items.length
    
    findCart.items.push({})
    objectCreate.items=findCart.items
    objectCreate.items[lengthOfItems-1].productId=productId
    objectCreate.items[lengthOfItems-1].quantity=data.quantity

    let initialPrice=findCart.totalPrice
    let finalPrice=(data.quantity*findProduct.price)+initialPrice

    objectCreate.totalPrice=finalPrice
    objectCreate.totalItems=objectCreate.items.length

    let addNewCart= await cartModel.create(objectCreate)

    return res.status(200).send({status:false,message:"Cart is added successfully",data:addNewCart})
    }
}

catch(err){
    return res.status(500).send({status:false,message:err.message})
}

}


module.exports={createCart}