const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dvxz4nfnx", // ✅ new cloud name
  api_key: "176487835777454", // ✅ new API key
  api_secret: "tHPj_n_gEPHUnhfMot9H0TO3LvU" // ✅ new secret
});

module.exports = cloudinary;
