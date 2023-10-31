import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import passport from 'passport';
import flash from 'connect-flash';
import { body, validationResult } from 'express-validator';
import expressAsyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import Blogger from '../models/blogger';
import Post from '../models/post';
import * as dotenv from 'dotenv';
dotenv.config();
const jwtAccess = process.env.ACCESS_TOKEN_SECRET;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ title: 'Express' });
});

// Handle post login page
router.post('/login', (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    (err: Error, user: any, info: any) => {
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
        const token = jwt.sign({ sub: user._id }, jwtAccess);
        return res.status(200).json({ user, token });
      });
    }
  )(req, res);
});

//Handle POST Sign up
router.post(
  '/sign-up',
  [
    // validate and sanitize the fields
    body('username')
      .trim()
      .isLength({ min: 3 })
      .escape()
      .withMessage('username must be atleast 3 characters long'),
    body('password')
      .trim()
      .isLength({ min: 7 })
      .escape()
      .withMessage('password must be atleast 7 characters long'),
    body('email')
      .trim()
      .isEmail()
      .escape()
      .withMessage('must supply valid email'),
  ],
  expressAsyncHandler(async (req, res, next) => {
    //Extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const existingUser = await Blogger.findOne({ username: req.body.username });
    if (existingUser) {
      res.status(400).json({ message: 'this username already exists' });
      return;
    }

    // Hash the password with bcryptjs
    const hashedPass = await bcrypt.hash(req.body.password, 10);

    // Create and save the new user
    const newUser = new Blogger({
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
  })
);

// GET request for getting one post
router.get(
  '/post/:id',
  expressAsyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate('blogger').exec();
    if (!post) {
      res.status(404).json({
        message: 'post not found',
      });
    } else {
      res.status(200).json({
        post,
      });
    }
  })
);

//GET all posts
router.get(
  '/posts',
  expressAsyncHandler(async (req, res, next) => {
    const allPosts = await Post.find().populate('blogger').exec();
    if (!allPosts) {
      res.status(404).json({
        message: 'No Posts',
      });
    } else {
      res.status(200).json({
        allPosts,
      });
    }
  })
);

export default router;
