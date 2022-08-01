const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId

const cartSchema= new mongoose.Schema({
    userId: {
        type:ObjectId,
         ref:'User'
        },
  items: [{
    productId: {
        type:ObjectId, 
        ref:'product', 
         
        },
    quantity: {
        type:Number, 
        
    }
  }],
  totalPrice: {
    type:Number, 
    
},
  totalItems: {
    type:Number, 
},
},{timeStamps:true});

module.exports=mongoose.model("cart",cartSchema)