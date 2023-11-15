import { Schema, model, Types } from 'mongoose';
import { DateTime } from 'luxon';

enum Genre {
  Dembow = 'Dembow',
  Reggaeton = 'Reggaeton',
  Trap = 'Trap',
}

interface Post {
  title: string;
  art: string;
  mediaUrl: string;
  content: object;
  date_created: Date;
  tags: string[];
  genre: Genre;
  blogger: Types.ObjectId;
}

const PostSchema = new Schema<Post>({
  title: { type: String, required: true },
  art: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  content: Object,
  date_created: { type: Date, default: Date.now, required: true },
  tags: [{ type: String }],
  genre: { type: String, enum: Object.values(Genre), required: true },
  blogger: { type: Schema.Types.ObjectId, ref: 'Blogger', required: true },
});

PostSchema.virtual('url').get(function () {
  return `/post/${this._id}`;
});
PostSchema.virtual('date_created_formatted').get(function () {
  return DateTime.fromJSDate(this.date_created).toLocaleString(
    DateTime.DATE_MED
  );
});

const Post = model<Post>('Post', PostSchema);

export default Post;
