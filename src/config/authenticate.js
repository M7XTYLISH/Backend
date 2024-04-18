import createHttpError from "http-errors";
import { config } from "./config.js";
import pkg from "jsonwebtoken";

const { verify } = pkg;

const authenticate = (req, res, next) => {
    const token = req.header("Authorization");

    if(!token) {
        const error = createHttpError(401, "Authorization token is required");
        return next(error);
    }

    try {
        const parsedToken = token.split(" ")[1];

        const tokenDecoded = verify(parsedToken, config.jwtSecret);
        
        req.userId = tokenDecoded.sub;
    } catch (err) {
        const error = createHttpError(401, "Token Expired.");
        return next(error);
    }

    next();
}

export default authenticate;