const express=require("express")
const router=express.Router()

const userController=require("../controllers/userController")
const verify=require("../middleware/auth")
const productController=require("../controllers/productController")
const cartController=require('../controllers/cartController')

/*----------------------------USER API's-------------------------------------- */
router.post("/register",userController.createUser)

router.post('/login', userController.loginUser)

router.get("/user/:userId/profile",verify.authentication,userController.getUserById)

router.put("/user/:userId/profile",userController.updateUser)


router.post("/product",productController.createProduct)

router.get("/filter",productController.filterProduct)

router.get("/getById/:productId",productController.getById)

router.put("/update/:productId",productController.updateProduct)

router.delete("/delete/:productId",productController.deleteProduct)



router.post("/createCart/:userId",cartController.createCart)

router.delete("/users/:userId/cart",cartController.deleteCart)

router.put("/users/:userId/cart",cartController.updateCart)

router.get("/users/:userId/cart",cartController.getCart)












module.exports=router