import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import jwt, { JwtPayload } from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import expressAsyncHandler from 'express-async-handler';
import axios, { AxiosResponse, AxiosError } from 'axios';
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
  // Convert the tags to an array.
  (req: Request, res: Response, next: NextFunction) => {
    if (!(req.body.tags instanceof Array)) {
      if (typeof req.body.tags === 'undefined') req.body.tags = [];
      else req.body.tags = new Array(req.body.tags);
    }
    next();
  },
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
    // body('content').trim().escape(),
    body('tags.*').trim().escape(),
    body('genre')
      .trim()
      .isIn(['Dembow', 'Reggaeton', 'Trap'])
      .escape()
      .withMessage('Genre is not defined'),
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
      date_created: Date.now(),
      tags: req.body.tags,
      genre: req.body.genre,
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
router.put(
  '/post/:id',
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
    body('tags.*').trim().escape(),
    body('genre')
      .trim()
      .contains('Dembow' || 'Reggaeton' || 'Trap')
      .escape()
      .withMessage('Genre is not defined'),
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
    // Find old post to extract date_created in order to not rearrange posts
    const oldPost = await Post.findById(req.params.id);
    // Create new post with same _id value as previous post
    const post = new Post({
      title: req.body.title,
      art: req.body.art,
      mediaUrl: req.body.mediaUrl,
      content: req.body.content,
      date_created: oldPost.date_created,
      tags: req.body.tags,
      genre: req.body.genre,
      blogger: blogger._id,
      _id: req.params.id,
    });
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, post, {});
    // alert user post has been updated
    res.status(200).json({
      message: `Post titled: ${post.title} has been updated`,
      post: post,
    });
  })
);

// DELETE request for deleting a post
router.delete(
  '/post/:id',
  expressAsyncHandler(async (req, res, next) => {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: 'Post Deleted Succesfully',
    });
  })
);

router.get('/link', async (req, res, next) => {
  // const url = new URL(req.url);
  const url = req.query.url as string;
  const urlFull = new URL(url);
  // const href = urlFull.searchParams.get('url');

  // const href = url.searchParams.get('url');

  if (!urlFull) {
    return res
      .status(400)
      .json({ message: 'Invalid Url something is wrong with the early url' });
  }
  try {
    const axiosResult = await axios.get(urlFull.toString());

    const titleMatch = axiosResult.data.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';

    const descriptionMatch = axiosResult.data.match(
      /<meta name="description" content="(.*?)"/
    );
    const description = descriptionMatch ? descriptionMatch[1] : '';

    const imageMatch = axiosResult.data.match(
      /<meta property="og:image" content="(.*?)"/
    );
    const imageUrl = imageMatch ? imageMatch[1] : '';

    return res.status(200).json({
      success: 1,
      meta: {
        title,
        description,
        image: {
          url: imageUrl,
        },
      },
    });
  } catch (error) {
    const trueError = error as AxiosError;
    if (trueError.response) {
      return res.status(400).json({ message: trueError.response.data });
    } else if (trueError.request) {
      return res.json({ message: 'no request recieved' });
    } else {
      return res.json({ trueError });
    }
  }
});
export default router;
