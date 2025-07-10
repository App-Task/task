const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dfli5co1y",             // ✅ Your new cloud name
  api_key: "633694813154673",      // ✅ Replace with real API key from dashboard
  api_secret: "s_Hx8hR0c-9zWrxKhilDBA2At4c" // ✅ Replace with real secret
});

module.exports = cloudinary;
