import { Schema, model } from 'mongoose';

interface Blogger {
  username: string;
  password: string;
  email: string;
  admin: boolean;
  _id: number;
}

const BloggerSchema = new Schema<Blogger>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  admin: Boolean,
});

const Blogger = model<Blogger>('Blogger', BloggerSchema);

export default Blogger;
