import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import jwt, { JwtPayload } from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import expressAsyncHandler from 'express-async-handler';
import Blogger from '../models/blogger';
import Post from '../models/post';
import * as dotenv from 'dotenv';
dotenv.config();
const jwtAccess = process.env.ACCESS_TOKEN_SECRET;

// Middleware to verify and decode the JWT token
async function verifyJwtToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded: JwtPayload = jwt.verify(token, jwtAccess) as JwtPayload; // Use your actual secret key here
    const blogger = await Blogger.findById(decoded.sub);
    if (!blogger) {
      return res.status(404).json({ message: 'User not found.' });
    }
    req.user = blogger; // Store the decoded user data in the request object for later use
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
}

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.json('your JWT token worked you are good to go');
});

// POST request for handling post creation
router.post(
  '/post/create',
  [
    // validate and sanitize the fields
    body('title')
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage('Must input title'),
    body('art')
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage('must input art url'),
    body('mediaUrl')
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage('must input link to media'),
    body('content').trim().escape(),
  ],
  verifyJwtToken,
  expressAsyncHandler(async (req, res, next) => {
    //Extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    // Find Blogger to save as blogger for post
    const blogger = await Blogger.findOne({ username: req.user.username });
    // Create and save the new post
    const newPost = new Post({
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
  })
);

// PUT request for updating a post
router.put('/post/:id');

// DELETE request for deleting a post
router.delete('/post/:id');

export default router;
