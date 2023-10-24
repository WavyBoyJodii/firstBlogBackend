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
const express_validator_1 = require("express-validator");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const blogger_1 = __importDefault(require("../models/blogger"));
const post_1 = __importDefault(require("../models/post"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const jwtAccess = process.env.ACCESS_TOKEN_SECRET;
// Middleware to verify and decode the JWT token
async function verifyJwtToken(req, res, next) {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res
            .status(401)
            .json({ message: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtAccess); // Use your actual secret key here
        const blogger = await blogger_1.default.findById(decoded.sub);
        if (!blogger) {
            return res.status(404).json({ message: 'User not found.' });
        }
        req.user = blogger; // Store the decoded user data in the request object for later use
        next();
    }
    catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
}
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.json('your JWT token worked you are good to go');
});
// POST request for handling post creation
router.post('/post/create', [
    // validate and sanitize the fields
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('Must input title'),
    (0, express_validator_1.body)('art')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('must input art url'),
    (0, express_validator_1.body)('mediaUrl')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('must input link to media'),
    (0, express_validator_1.body)('content').trim().escape(),
], verifyJwtToken, (0, express_async_handler_1.default)(async (req, res, next) => {
    //Extract the validation errors from a request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    // Find Blogger to save as blogger for post
    const blogger = await blogger_1.default.findOne({ username: req.user.username });
    // Create and save the new post
    const newPost = new post_1.default({
        title: req.body.title,
        art: req.body.art,
        mediaUrl: req.body.mediaUrl,
        content: req.body.content,
        blogger: blogger._id,
    });
    await newPost.save();
    // redirect to login page
    res.status(200).json({
        message: `new Post created titled: ${newPost.title}`,
    });
}));
// PUT request for updating a post
router.put('/post/:id');
// DELETE request for deleting a post
router.delete('/post/:id');
exports.default = router;
//# sourceMappingURL=users.js.map