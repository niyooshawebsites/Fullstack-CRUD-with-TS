import mongoose from "mongoose"
import type { Document } from "mongoose"
import type { IUser } from "../types/user.types.js";
import bcrypt from "bcryptjs"

export interface IUserDocument extends IUser, Document {}

const userSchema = new mongoose.Schema<IUserDocument>({
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type:String,
        required:true
    }
}, {
    timestamps: true
})

// for hashing the password at registration
userSchema.pre("save", async function () {
    if(!this.isModified("password")) return ;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

// for comparing the password at login
userSchema.methods.comparePassword = async function(candidatePassword: string):Promise<boolean>{
    return bcrypt.compare(candidatePassword, this.password);
}

export const User = mongoose.model<IUserDocument>('User', userSchema)