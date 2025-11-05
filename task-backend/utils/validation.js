const { z } = require("zod");

// Schemas
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["client", "tasker"]).optional(),
  phone: z.string().trim().min(5).max(30),
  callingCode: z.string().optional(),
  rawPhone: z.string().optional(),
  countryCode: z.string().optional(),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  role: z.enum(["client", "tasker"]).optional(),
}).strict();

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
}).strict();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).max(30).optional(),
  profileImage: z.string().url().nullable().optional(),
  gender: z.string().max(30).optional(),
  location: z.string().max(200).optional(),
  skills: z.string().max(500).optional(),
  about: z.string().max(1000).optional(),
  callingCode: z.string().optional(),
  rawPhone: z.string().optional(),
  countryCode: z.string().optional(),
}).strict();

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  role: z.enum(["client", "tasker"]).optional(),
}).strict();

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  newPassword: z.string().min(8).max(128),
  role: z.enum(["client", "tasker"]).optional(),
}).strict();

const createBidSchema = z.object({
  taskId: z.string().length(24),
  taskerId: z.string().length(24),
  amount: z.number().nonnegative(),
  message: z.string().max(1000).optional(),
}).strict();

const updateBidSchema = z.object({
  amount: z.number().nonnegative().optional(),
  message: z.string().max(1000).optional(),
}).strict();

const sendMessageSchema = z.object({
  receiver: z.string().length(24),
  text: z.string().max(2000).optional(),
  taskId: z.string().length(24).optional(),
  image: z.string().url().optional(),
}).strict();

const uploadDocumentSchema = z.object({
  userId: z.string().length(24),
}).strict();

// Middleware
const validate = (schema) => (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = schema.parse(req.body);
    } else {
      schema.parse({});
    }
    next();
  } catch (e) {
    return res.status(400).json({ msg: "Invalid request", details: e.errors?.map(x => x.message) });
  }
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createBidSchema,
  updateBidSchema,
  sendMessageSchema,
  uploadDocumentSchema,
};


