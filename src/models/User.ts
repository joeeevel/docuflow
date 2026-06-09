import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  currentWorkspaceId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    currentWorkspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);
