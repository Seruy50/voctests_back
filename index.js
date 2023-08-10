import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import UserModel from './components/models/UserModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import CollectionModel from './components/models/CollectionsModel.js';
import multer from 'multer';
import fs from 'fs';





const app = express();

app.use(cors());
app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({extended: true, limit: '25mb'}));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype === 'image/png') {
            cb(null, 'images')
        } else {
            cb(null, 'text')
        }
    },
    filename: async (req, file, cb) => {
        cb(null, (+new Date()).toString() + '-' + file.originalname)
    }
})

const upload = multer({storage});

app.post('/uploadText', upload.single('text'), async (req, res) => {
    try {
        let path = req.file.path;
        let array = '';
        let clearArray = [];
        
        fs.readFile(path, 'utf8', (err, data) => {
            array = ' ' + array;
            array = data.split(' '); 

            clearArray = array.map(data => {
                if(
                    data.match(/[A-Za-zА-Яа-я]/)              
                    && 
                    !data.match(/\—|\’|\@|\*|\#|\$|\^|\&|\_|\d|\s/g)
                ){
                    data = data.split('');
                    
                    let word = data.filter(letter => {         
                        if (!letter.match(/\,|\.|\?|\"|\'|\(|\)|\[|\]|\{|\}|\»|\«/)){
                            return letter;
                        }       
                    })

                    word = word.join('');

                    word = word.slice(0, 1).toUpperCase() + word.slice(1);

                    return word;
            }})

            clearArray = Array.from(new Set(clearArray));

            clearArray = clearArray.join(', ');
            
            res.send(clearArray);

            fs.writeFile('./text/newFile.txt', clearArray, (e) => {
                if (e){
                   console.log(e) 
                }
            });
        })
        
        fs.unlink('./' + path, e => console.log(e))
        console.log(clearArray)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }   
})

app.post('/close', (req, res) => {
    console.log(req)
})

app.post('/download', async (req, res) => {
    
    res.download('./text/newFile.txt', 'words')
    
    
})


app.post('/uploadImage', upload.single('avatar'), (req, res) => {
    req.file;
    res.send('OK')
})





app.post('/tokenCheck', async(req, res) => {
    let isExpired = jwt.decode(req.body.token, 'Secret123').exp < new Date() / 1000;
   
    if(isExpired) {
        res.send('no');
        return;
    }

    let decoded = jwt.verify(req.body.token, 'Secret123');

    let user = await UserModel.findById(decoded._id);
    

    res.send(user) 
})

app.post('/registration', async (req, res) => {
    try {
        let {login, password, email, fullName} = req.body;
        let hashPassword = await bcrypt.hash(String(password), await bcrypt.genSalt(10));
        let code = Math.floor(10000 + Math.random() * (99999 + 1 - 10000))
        let doc = new UserModel({
            login: login,
            password: hashPassword,
            email: email,
            fullName: fullName,
            isActive: false
        })

        await doc.save();

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
             user: 'voctests50@gmail.com',
             pass: process.env.EMAIL_TEST_APP_PSWD
            } 
         })


        let mailOptions = {
            from: 'voctests50@gmail.com',
            to: email,
            subject: 'Registration',
            text: "Your confirmation code is " + code
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if(err) {
                console.log(err)
            } 
        })
        
        let user = await UserModel.findOne({login: login});

        res.send({user: user._id, code: code});
    } catch (error) {
        res.status(500).send(error.keyValue)
    }
})

app.post('/registration/confirm', async(req, res) => {
    await UserModel.findByIdAndUpdate(req.body.user, {isActive: true}, {overwtire: true});
    
    res.send('activated');
})

app.post('/login', async(req, res) => {
    
    try {
        let {login, password} = req.body;
        let user = await UserModel.findOne({login : login});
        if(!user){
            res.send('Wrong');
            return;
        }
        let userCheck = await bcrypt.compare(String(password), user.password);

        if(!userCheck){
            res.send('Wrong');
            return;
        }

        
        let token = jwt.sign(
            {
                _id: user._id
            },
            'Secret123',
            {
                expiresIn: '1h'
            }
            )
        
        
        let collections = await CollectionModel.find({user: user._id})

        res.send({token: token, user: user, collections: collections}); 
    } catch (error) {
       res.send(error)
    }
})

app.post('/getCollections', async(req, res) => {
    let collections = await CollectionModel.find({user: req.body._id})
    
    res.send({collections})
})

app.post('/addCollection', async(req, res) => {
    try {
        let doc = new CollectionModel({
            name: req.body.name,
            theme: req.body.theme,
            user: req.body._id,
            words: req.body.words
        })
    
        await doc.save()
        let collections = await CollectionModel.find({user: req.body._id})
        res.send(collections)
    } catch (error) {
        res.status(418).send(error)
    }
})

app.post('/deleteCard', async (req, res) => {
    await CollectionModel.findByIdAndDelete(req.body.id);
    let collections = await CollectionModel.find({user: req.body.user})
    res.send(collections)
})

app.patch('/changeCollection', async(req, res) => {
    console.log((req.body))
    try {
        if (req.body.command === 'add'){
            let collection = await CollectionModel.findById(req.body.id);
            let oldWords = collection.words;
            
            oldWords.push(...req.body.words);
        
            await CollectionModel.findByIdAndUpdate(req.body.id, {words: oldWords}, {overwtire: true});

            res.send('doneADD')
        } else {
            
           
            let words = JSON.parse(req.body.words)
            console.log(words)
            await CollectionModel.findByIdAndUpdate(req.body.id, {words: words}, {overwrite: true});

            res.send('doneCHANGE')
        }
    } catch (error) {
        res.status(500).send(error);
    }
    
})

async function start(){
    app.listen(3001, () => console.log('Server - OK'));

    await mongoose.connect(`mongodb+srv://${process.env.username}:${process.env.password}@cluster0.9b7eurn.mongodb.net/vocabluary/?retryWrites=true&w=majority`)
    .then(() => console.log('Database - OK'))
    .catch((err) => console.log(err))
}

start();