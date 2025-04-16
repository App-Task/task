const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login); // 👈 THIS is the login endpoint!

module.exports = router;

