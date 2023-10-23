import { Schema, model, Types } from 'mongoose';

interface Blogger {
  username: string;
  password: string;
  email: string;
  admin: boolean;
}

const BloggerSchema = new Schema<Blogger>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  admin: Boolean,
});

const Blogger = model<Blogger>('Blogger', BloggerSchema);

export default Blogger;
