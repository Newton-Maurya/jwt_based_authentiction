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
    }

}

const logAuth = async function (req, res, next){
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
                next()
            }
            else{
                res.status(403).send(json({error: 'Wrong email id or password'}))
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
                res.status(403).send(json({error: 'Wrong email id or password'}))
            }
        }
    }
    catch(err){
        res.status(500).send(json(err))
    }
}

const delAuth = async function (req, res, next){
    try{
        const token = await jwt.verify(req.cookies.jwt_token, process.env.SECRETE_KEY);
        const userID = token._id;
        let result;
        if(userID === "6127d4a9f9fa56e8feaf63a3"){
            result = await Products.findByIdAndDelete({_id: userID});
            req.productList = result;
            next()
        }
        else{
            req.status(403).send('You are not admin')
        }
    }
    catch(err){
        res.sendStatus(403);
    }
}

app.post('/register', newAutherization, (req, res) => {
    res.cookie('jwt_token', req.token, {
        httpOnly:true
    }).status(201).send(req.list)
})
app.post('/adminLogin', logAuth, (req, res)=>{
    res.cookie('jwt_token', req.token, {
        httpOnly:true
    }).status(201).send(req.proList)
})

app.delete('/delete/:id', delAuth, (req, res) => {
    res.status(201).send(req.productList)
})

// listening
app.listen(4580, () => {
    console.log('Server running on port 4580');
})