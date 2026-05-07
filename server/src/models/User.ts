import mongoose, { type InferSchemaType, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'hr', 'viewer'], default: 'hr' },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving — Mongoose 9: no 'next' callback, just async
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
  }
});

// Instance method for password comparison
UserSchema.method('matchPassword', async function (enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password as string);
});

export type IUser = InferSchemaType<typeof UserSchema> & {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
};

const User = mongoose.model('User', UserSchema);
export default User;