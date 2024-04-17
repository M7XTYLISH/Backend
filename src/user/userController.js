import createHttpError from "http-errors";
import userModel from "./userModel";


const createUser = async (req, res, next) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
        const error = createHttpError(400, "All fields are required!");
        return next(error);
    }
    
    const user = await userModel.findOne({ email });

    if(user){
        const error = createHttpError(400, "User already exists with this email.");
        return next(error);
    }

    

    res.json({ message: "User Created"});
};

export { createUser };
