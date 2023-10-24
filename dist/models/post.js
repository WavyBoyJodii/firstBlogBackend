"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PostSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    art: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    content: String,
    blogger: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Blogger', required: true },
});
const Post = (0, mongoose_1.model)('Post', PostSchema);
exports.default = Post;
//# sourceMappingURL=post.js.map