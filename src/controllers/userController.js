const userModel=require("../models/userModel")
const bcrypt=require("bcrypt")
const validator=require("../utility/validation")
const aws=require("../utility/awsconfig")
const jwt = require("jsonwebtoken")
const mongoose=require("mongoose")

const phoneRex=/^[6789][0-9]{9}$/
const regexPincode=/^\d{6}$/

const createUser=async (req,res)=>{
    try{
        let files = req.files;
        const requestBody=req.body
        // console.log(requestBody)
        if(!validator.isValidBody(requestBody))return res.status(400).send({ status: false, message: 'Please provide user details' })

        let { fname, lname, phone, email, password, address } = requestBody// Object destructing
//------------------------------Validation starts-------------------------------
        //fname
        if(!validator.isValid(fname))return res.status(400).send({ status: false, message: `fname is required` });
        if(!fname.trim().match(/^[a-zA-Z]{2,20}$/))return res.status(400).send({ status: false, message: `Firstname should only contain alphabet` });

        //lname
        if (!validator.isValid(lname)) return res.status(400).send({ status: false, message: `lname is required ` });
        if(!lname.trim().match(/^[a-zA-Z]{2,20}$/))return res.status(400).send({ status: false, message: `lname should only contain alphabet ` });

        //email
        if (!validator.isValid(email)) return res.status(400).send({ status: false, message: `Email is required` })
        email = email.trim().toLowerCase()
        if(!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: `Email should be a valid email address ` })
        const isEmailAlreadyUsed = await userModel.findOne({ email }); 
        if (isEmailAlreadyUsed) return res.status(400).send({ status: false, message: `${email} email address is already registered` })

        //profileImage
        if(!files || (files && files.length ===0))return res.status(400).send({status: false, message: 'Profile image is required'})
        const profilePicture=await aws.uploadFile(files[0],"user")

        //phone
        if (!validator.isValid(phone)) return res.status(400).send({ status: false, message: 'phone no is required' });
        if (!phone.trim().match(phoneRex)) return res.status(400).send({ status: false, message: `Please fill a valid Indian phone number` })
        const isPhoneAlreadyUsed = await userModel.findOne({ phone });
        if (isPhoneAlreadyUsed) return res.status(400).send({ status: false, message: `${phone} phone number is already registered` })

        //password
        if (!validator.isValid(password)) return res.status(400).send({ status: false, message: `Password is required` })
        if (!(password.trim().length > 7 && password.length < 16)) return res.status(400).send({ status: false, message: "password should  between 8 and 15 characters" })
        if(!validator.isValidPassword(password))return res.status(400).send({ status: false, message: `Password must contain a Capital,Symbol,Numeric` }) 
       
        //address
        if (!validator.isValid(address))
        return res.status(400).json({ status: false, msg: "Address is required" });
        if(typeof address!="object")return res.status(400).json({ status: false, msg: "Please provide Address is Object" });

        if (address) {
            if (address.shipping) {
                if (!validator.isValid(address.shipping.street))return res.status(400).send({status: false,Message: "Please provide your street name in shipping address"})

                if (!validator.isValid(address.shipping.city))return res.status(400).send({status: false,Message: "Please provide your city name in shipping address"})

                if (!validator.isValid(address.shipping.pincode))return res.status(400).send({status: false,Message: "Please provide your pin code in shipping address"})

                if (!/^\d{6}$/.test(address.shipping.pincode))return res.status(400).send({status: false,message: "Pincode should in six digit Number"})
            } else {
                return res.status(400).send({ status: false, message: "please provide shipping address" })
            }

            if (address.billing) {
                if (!validator.isValid(address.billing.street))return res.status(400).send({status: false,Message: "Please provide your street name in billing address"})

                if (!validator.isValid(address.billing.city))return res.status(400).send({status: false,Message: "Please provide your city name in billing address"})

                if (!validator.isValid(address.billing.pincode))return res.status(400).send({status: false,Message: "Please provide your pin code in billing address"})
                if (!/^\d{6}$/.test(address.billing.pincode))return res.status(400).send({status: false,message: "Pincode should in six digit Number",})
            } else {
                return res.status(400).send({ status: false, message: "please provide billing address" })
            }
        }
      
// ---------------------------------Validation ends-------------------------------
        const salt =await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            fname: fname,
            lname: lname,
            profileImage: profilePicture,
            email: email,
            phone,
            password: hashedPassword,
            address: address,
          }
        
        const newUser = await userModel.create(userData);
        return res.status(201).send({ status: true, message: ` User created successfully`, data: newUser });
    }catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }
}


const loginUser=async function(req,res){
    try{
     let loginData=req.body
     let {email,password}=loginData
     
     //validation
     if(!validator.isValidBody(loginData)) return res.status(400).send({status:false,message:"Please fill email or password"})
     let empStr=""
     if(!validator.isValidEmail(email)) empStr=empStr+"Email "
     if(!validator.isValidPassword(password)) empStr=empStr+"Password"
     if(!validator.isValidEmail(email) || !validator.isValidPassword(password)){
        return res.status(400).send({status:false,message:`Please fill valid or mandatory ${empStr}`})
     }
     
    let user = await userModel.findOne({ email: email});
    if (!user) {
         return res.status(404).send({ status: false, message: "User Not found" });
      }

   const validPassword=await bcrypt.compare(password,user.password)
    if(!validPassword){
       return res.status(400).send({status: false, message: "wrong password"})
    }

    let iat = Date.now()
    let exp = (iat) + (24 * 60 * 60 * 1000)
    let token = jwt.sign(
         {
            userId: user._id.toString(),
            iat: iat,
            exp: exp
         },
         "project/booksManagementGroup7"
      ); 
    
   //   res.status(200).setHeader("x-api-key", token);
    return res.status(200).send({status:true,message:"Success",data:{userId:user._id,token:token}})
    }catch(err){
     return res.status(500).send({status:false,message:err.message})
    }
}


const getUserById=async (req,res)=>{
    try{
        const userId=req.params.userId
        if(!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `${userId} is not a valid userId` })
        const user=await userModel.findOne({_id:userId})
        if(!user)return res.status(404).send({status:false,message:"UserId Not found"})
        return res.status(200).send({ status: true, message: 'User profile details', data: user })
    }catch(error){
        return res.status(500).send({status:false,message:error.message})
    }
}


let updateUser = async  (req, res)=> {
    let userId = req.params.userId

    if (!mongoose.isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "You entered a Invalid userId in params" })

    // if (userId != req.userId)
    //     return res.status(400).send({ status: false, message: "Authorisation Failed--> you are not allowed to modify another acoount" })

    let data = req.body
    let objectUpdate={updatedAt:Date.now()}

    // let email=data.email
    if (data.fname) {

        if (!validator.isValid(data.fname))
            return res.status(400).send({ status: false, message: "fname should not be empty" })
         
            objectUpdate.fname=data.fname
        }

    if (data.lname ) {
        if (!validator.isValid(data.lname))
            return res.status(400).send({ status: false, message: "lname should not be empty" })
         
            objectUpdate.lname=data.lname
        }

    if (data.email) {
        if (!validator.isValid(data.email))
            return res.status(400).send({ status: false, message: "email should not be empty" })

    let findEmail = await userModel.findOne({ email: data.email })
        if (findEmail) {
            if (findEmail._id != userId)

                return res.status(400).send({ status: false, message: "email is already exists please enter a new emailId " })
        }
        if (validator.isValidEmail(data.email) == false) return res.status(400).send({ status: false, message: "You entered a Invalid email" })

        objectUpdate.email=data.email
    }

    if (data.phone) {
        if (!validator.isValid(data.phone))
            return res.status(400).send({ status: false, message: "phone should not be empty" })
        let findPhone = await userModel.findOne({ phone: data.phone })

        if (findPhone) {

            if (findPhone._id != userId)
                return res.status(400).send({ status: false, message: "This phone number is already exists" })
        }
        if (phoneRex.test(data.phone) == false) return res.status(400).send({ status: false, message: "You entered a Invalid phone number" })

        objectUpdate.phone=data.phone
    }

    let address=data.address

    if (address) {
        let findAddress= await userModel.findOne({_id:userId})

        objectUpdate.address=findAddress.address

        if (address.shipping) {
            
                if(address.shipping.street){
                    if(!validator.isValid(address.shipping.street))
                    return res.status(400).send({status:false,message:"street of shipping address should not be empty...."})

                    objectUpdate.address.shipping.street=address.shipping.street
                }

                if(address.shipping.city){
                    if(!validator.isValid(address.shipping.city))
                    return res.status(400).send({status:false,message:"city of shipping address should not be empty...."})

                    objectUpdate.address.shipping.city=address.shipping.city
                }

                if(address.shipping.pincode){
                    if(!validator.isValid(address.shipping.pincode))
                    return res.status(400).send({status:false,message:"pincode of shipping address should not be empty...."})

                    if(regexPincode.test(address.shipping.pincode)==false)
                    return res.status(400).send({status:false,message:"You entered a invalid Pincode in Shipping address."})

                    objectUpdate.address.shipping.pincode=address.shipping.pincode          
                   }
        }

        if (address.billing) {
           
            if(address.billing.street){
                if(!validator.isValid(address.billing.street))
                return res.status(400).send({status:false,message:"street of billing address should not be empty...."})

                objectUpdate.address.billing.street=address.billing.street
            }

            if(address.billing.city){
                if(!validator.isValid(address.billing.city))
                return res.status(400).send({status:false,message:"city of billing address should not be empty...."})

                objectUpdate.address.billing.city=address.billing.city
            }

            if(address.billing.pincode){
                if(!validator.isValid(address.billing.pincode))
                return res.status(400).send({status:false,message:"pincode of billing address should not be empty...."})

                if(regexPincode.test(address.billing.pincode)==false)
                return res.status(400).send({status:false,message:"You entered a invalid Pincode in billing address."})

                objectUpdate.address.billing.pincode=address.billing.pincode          
               }

        }

        }
    let profileImage=req.files;

    if (profileImage && profileImage.length>0) {

        let uploadImage = await aws.uploadFile(profileImage[0])

         objectUpdate.profileImage= uploadImage


    }

    
    let checkPassword=data.password
    if (checkPassword) {
        if (!validator.isValid(checkPassword)){
            return res.status(400).send({ status: false, message: "password cannot be empty" });
        }

        if (checkPassword<8 || checkPassword>15) {
            return res.status(400).send({ status: false, message: "Password length should be in the range of 8 to 15 .........." })
        }

    
        
        const hashedPassword = await bcrypt.hash(checkPassword,10)

        objectUpdate.password = hashedPassword
        console.log(hashedPassword)
    }



    let updateData = await userModel.findOneAndUpdate({ _id: userId }, { $set: objectUpdate}, { new: true })

    if (!updateData) {
        return res.status(404).send({ status: false, message: "No user Found" })
    }

    return res.status(200).send({ status: true, message: "Data is updated successfully", data: updateData })

}

module.exports={createUser,getUserById,loginUser,updateUser}