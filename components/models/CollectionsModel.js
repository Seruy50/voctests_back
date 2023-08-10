import mongoose from 'mongoose';

const CollectionSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    theme: String,
    user: String,
    words: Array
})

export default mongoose.model('collections', CollectionSchema);