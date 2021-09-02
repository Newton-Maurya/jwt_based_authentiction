const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./model/user');
const Products = require('./model/product');
const { json } = require('express');
require('dotenv').config()
const app = express();
console.log(User);

// midlewares
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(cors())

// Established connection
mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection
    .once('open', ()=>{
        console.log('Established connection from database');
    })
    .on('err', (err) => {
        console.log('error' + err);
    })

//  jwt authentication
const newAutherization = async function (req, res, next) {
    try{
        const token = await jwt.sign({email: req.body.email, password: req.body.password}, process.env.SECRETE_KEY);
        console.log(token);
        const userData = new User({
            name: req.body.name,
            emailID: req.body.email,
            password: req.body.password,
            conf_pass: req.body.conf_pass,
            jwt_token: token
        })
        console.log(userData);
        await userData.save((err, doc) => {
            if (err) return console.error(err);
            else{
                console.log('doc inserted successfully', doc);
            }
        });
        const productsList = await Products.find({}); 
        console.log(productsList);
        req.token = token
        req.list = productsList
        next()
    }
    catch(err){
        console.log(err);
        res.status(401).send('error')
        next()

    }

}

const logAuth = async function (req, res, next){
    console.log(req.body);
    try{
        if(req.body.email === 'newtonmauryadw@gmail.com'){
            // console.log(req.body.email);
            const result = await User.findOne({emailID: req.body.email, password: req.body.password});
            console.log(result);
            let productsList;
            let token;
            let upResult
            if(result !== null){
                productsList = await Products.find({});
                token = await jwt.sign({email: req.body.email, password: req.body.password}, process.env.SECRETE_KEY);
                upResult = await User.findByIdAndUpdate({_id: result._id}, {$set: {jwt_token: token}}, {new: true})
                req.auth = result;
                req.proList = productsList;
                req.token = token
                console.log(token);
                next()
            }
            else{
                req.auth = result;
                res.sendStatus(401)
                next();

            }
        }
        else{
            const result = await User.findOne({emailID: req.body.email, password: req.body.password});
            console.log(result);
            let productsList;
            let token;
            let upResult
            if(result !== null){
                productsList = await Products.find({});
                token = await jwt.sign({email: req.body.email, password: req.body.password}, process.env.SECRETE_KEY);
                upResult = await User.findByIdAndUpdate({_id: result._id}, {$set: {jwt_token: token}}, {new: true})
                req.auth = upResult;
                req.proList = productsList;
                req.token = token
                next()
            }
            else{
                res.sendStatus(401)
                next()
            }
        }
    }
    catch(err){
        res.sendStatus(500)
        next()
    }
}

// Deleting product
const delAuth = async function (req, res, next){
    try{
        const proID = req.params.id;
        const token = await jwt.verify(req.cookies.jwt_token, process.env.SECRETE_KEY);
        const userID = token._id;
        let result;
        if(userID === "6127d4a9f9fa56e8feaf63a3"){
            result = await Products.findByIdAndDelete({_id: proID});
            req.productList = result;
            next()
        }
        else{
            req.status(403).send('You are not admin')
            next()

        }
    }
    catch(err){
        res.sendStatus(403);
        next()

    }
}

// Updating product details
const updateAuth = async function (){
    try{
        const proID = req.params.id;
        const token = await jwt.verify(req.cookies.jwt_token, process.env.SECRETE_KEY);
        const userID = token._id;
        let result;
        if(userID === "6127d4a9f9fa56e8feaf63a3"){
            result = await Products.findByIdAndUpdate({_id: proID}, {$set:{name: req.body.name, price: req.body.price}}, {new: true});
            req.productList = result;
            next()
        }
        else{
            req.status(403).send('Bad credidential')
            next()

        }
    }
    catch(err){
        res.sendStatus(403);
        next()

    }

}

app.post('/register', newAutherization, (req, res) => {
    res.cookie('jwt_token', req.token, {
        httpOnly:true
    }).status(201).send(req.list)
})
app.post('/login', logAuth, (req, res)=>{

    // console.log(req.body);
    if(req.auth){
        res.cookie('jwt_token', req.token, {
            httpOnly:true
        }).status(201).send(req.proList)
    }
})

app.delete('/api/delete/:id', delAuth, (req, res) => {
    res.status(201).send(req.productList)
})

// Updating product
app.put('/api/update/:id', updateAuth, (req, res) => {
    res.status(200).send(JSON.stringify({productList: req.proList}));
})
// listening
app.listen(4580, () => {
    console.log('Server running on port 4580');
})