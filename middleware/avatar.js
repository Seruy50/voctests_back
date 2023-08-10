import multer from 'multer';

const storage = multer.diskStorage({
    destination(req, file, cb){ 
        cb(null, 'images')
    },
    filename(req, file, cb){
        cb(null, new Date().toISOString() + '-' + file.originalname)  
    }
})

const types = ['image/png', 'image/jpeg', 'image/jpg'];
console.log(23)

const fileFilter = (req, file, cb) => {
    if (types.includes(file.mimetype)){
        cb(null, true)
        console.log(24)
    } else {
        cb(null, false)
        console.log(25)
    }
}

export default multer({storage, fileFilter})