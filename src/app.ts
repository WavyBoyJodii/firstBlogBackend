import createError, { HttpError } from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportJWT from 'passport-jwt';
import { ExtractJwt, StrategyOptions } from 'passport-jwt';
import flash from 'connect-flash';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import RateLimit from 'express-rate-limit';
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
});
import * as dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
const mongoUrl = process.env.MONGO_URL;
const jwtAccess = process.env.ACCESS_TOKEN_SECRET;

import indexRouter from './routes/index';
import usersRouter from './routes/users';

const app = express();

// connect to mongoDb with mongoose
mongoose.set('strictQuery', false);
const mongoDB = mongoUrl;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine setup
app.set('views', path.join(__dirname, '../', 'views'));
app.set('view engine', 'pug');

import Blogger from './models/blogger';
declare global {
  namespace Express {
    interface User {
      username: string;
      id?: number;
    }
  }
}
const LocalStrategy = passportLocal.Strategy;
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await Blogger.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

interface JwtPayload {
  sub: string; // Assuming 'sub' is a property in your JWT payload
  // Add other properties here as needed
}
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtAccess,
};
const JwtStrategy = passportJWT.Strategy;
passport.use(
  new JwtStrategy(jwtOptions, (payload: JwtPayload, done) => {
    Blogger.findById(payload.sub)
      .then((user) => {
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      })
      .catch((err) => done(err, null));
  })
);
// passport.use(JWTStrategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Blogger.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
    },
  })
);
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/user', passport.authenticate('jwt', { session: false }), usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
