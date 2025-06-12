const jwt = require("jsonwebtoken");
const handlers = require("./handlers");

const secretKey = process.env.SECRET_KEY;
const tokenExpirationTime = process.env.TOKEN_EXPIRATION_TIME;

const secure = process.env.NODE_ENV;
const sameSite = process.env.SAME_SITE;
const maxAge = process.env.MAX_AGE;

const generateBearerToken = ({ _id, res }) => {
  try {
    const token = jwt.sign({ _id }, secretKey, {
      expiresIn: tokenExpirationTime
    });

    res.cookie("authorization", token, {
      httpOnly: true,
      secure: secure === "production",
      sameSite: sameSite,
      maxAge: maxAge
    });

    return token;
  } catch (error) {
    handlers.response.error({ res, message: error });
  }
};

module.exports = generateBearerToken;
