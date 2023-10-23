"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BloggerSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    admin: Boolean,
});
const Blogger = (0, mongoose_1.model)('Blogger', BloggerSchema);
exports.default = Blogger;
//# sourceMappingURL=blogger.js.map