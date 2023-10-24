"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const express_validator_1 = require("express-validator");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const blogger_1 = __importDefault(require("../models/blogger"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const jwtAccess = process.env.ACCESS_TOKEN_SECRET;
/* GET home page. */
router.get('/', function (req, res, next) {
    res.json({ title: 'Express' });
});
// Handle post login page
router.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                message: 'Something is not right',
                err: err ? err.message : 'User not found',
            });
        }
        req.login(user, (err) => {
            if (err) {
                res.status(400).json({ err });
            }
            const token = jsonwebtoken_1.default.sign({ sub: user._id }, jwtAccess);
            return res.status(200).json({ user, token });
        });
    })(req, res);
});
//Handle POST Sign up
router.post('/sign-up', [
    // validate and sanitize the fields
    (0, express_validator_1.body)('username')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .withMessage('username must be atleast 3 characters long'),
    (0, express_validator_1.body)('password')
        .trim()
        .isLength({ min: 7 })
        .escape()
        .withMessage('password must be atleast 7 characters long'),
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .escape()
        .withMessage('must supply valid email'),
], (0, express_async_handler_1.default)(async (req, res, next) => {
    //Extract the validation errors from a request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const existingUser = await blogger_1.default.findOne({ username: req.body.username });
    if (existingUser) {
        res.status(400).json({ message: 'this username already exists' });
        return;
    }
    // Hash the password with bcryptjs
    const hashedPass = await bcryptjs_1.default.hash(req.body.password, 10);
    // Create and save the new user
    const newUser = new blogger_1.default({
        username: req.body.username,
        password: hashedPass,
        email: req.body.email,
        admin: true,
    });
    await newUser.save();
    // redirect to login page
    res.status(200).json({
        message: `new Account created for ${newUser.username}`,
    });
}));
exports.default = router;
//# sourceMappingURL=index.js.map