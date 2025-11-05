require("dotenv").config();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Please add it to your environment.");
  }
  return secret;
}

module.exports = { getJwtSecret };


