import mongoose from 'mongoose';

let UserSchema = mongoose.Schema({
    login: {
        type: String,
        require: true,
        unique: true,
    },
    password: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    fullName: {
        type: String,
        require: true
    },
    age: {
        type: Number,
    },
    country: {
        type: String,
    },
    isActive: Boolean
})

export default mongoose.model('users', UserSchema);