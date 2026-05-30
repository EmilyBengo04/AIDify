import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  password: String,
  university: String
}, { timestamps: true });

export default mongoose.model('User', userSchema);
