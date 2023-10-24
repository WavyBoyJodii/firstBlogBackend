import { Schema, model, Types } from 'mongoose';

interface Post {
  title: string;
  art: string;
  mediaUrl: string;
  content: string;
  blogger: Types.ObjectId;
}

const PostSchema = new Schema<Post>({
  title: { type: String, required: true },
  art: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  content: String,
  blogger: { type: Schema.Types.ObjectId, ref: 'Blogger', required: true },
});

const Post = model<Post>('Post', PostSchema);

export default Post;
