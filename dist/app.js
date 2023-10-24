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
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = __importDefault(require("passport-local"));
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const passport_jwt_2 = require("passport-jwt");
const connect_flash_1 = __importDefault(require("connect-flash"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 50,
});
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const mongoose_1 = __importDefault(require("mongoose"));
const mongoUrl = process.env.MONGO_URL;
const jwtAccess = process.env.ACCESS_TOKEN_SECRET;
const index_1 = __importDefault(require("./routes/index"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
// connect to mongoDb with mongoose
mongoose_1.default.set('strictQuery', false);
const mongoDB = mongoUrl;
main().catch((err) => console.log(err));
async function main() {
    await mongoose_1.default.connect(mongoDB);
}
// view engine setup
app.set('views', path_1.default.join(__dirname, '../', 'views'));
app.set('view engine', 'pug');
const blogger_1 = __importDefault(require("./models/blogger"));
const LocalStrategy = passport_local_1.default.Strategy;
passport_1.default.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await blogger_1.default.findOne({ username: username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username' });
        }
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            // passwords do not match!
            return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
const jwtOptions = {
    jwtFromRequest: passport_jwt_2.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtAccess,
};
const JwtStrategy = passport_jwt_1.default.Strategy;
passport_1.default.use(new JwtStrategy(jwtOptions, (payload, done) => {
    blogger_1.default.findById(payload.sub)
        .then((user) => {
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    })
        .catch((err) => done(err, null));
}));
// passport.use(JWTStrategy);
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await blogger_1.default.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});
app.use((0, cors_1.default)());
app.use(helmet_1.default.contentSecurityPolicy({
    directives: {
        'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
    },
}));
app.use((0, express_session_1.default)({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, connect_flash_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use('/api', index_1.default);
app.use('/user', passport_1.default.authenticate('jwt', { session: false }), users_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
exports.default = app;
//# sourceMappingURL=app.js.map