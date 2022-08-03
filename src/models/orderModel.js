const mongoose=require("mongoose")
const ObjectId=mongoose.Schema.Types.ObjectId

const orderSchema=new mongoose.Schema(
    {
        userId: {type: ObjectId, ref:"User", required:true},
        items: [{
          productId: {type:ObjectId, ref:'Product',required:true},
          quantity: {type:Number,required:true }
        }],
        totalPrice: {type:Number, required:true},
        totalItems: {type:Number,  required:true},
        totalQuantity: {type:Number,  required:true},
        cancellable: {type:Boolean, default: true},
        status: {type:String, default: 'pending'},// enum[pending, completed, cancled]},
        deletedAt: {type:Date}, // when the document is deleted}, 
        isDeleted: {type:Boolean, default: false}
      },{timeStamps:true})

module.exports=mongoose.model("Order",orderSchema)