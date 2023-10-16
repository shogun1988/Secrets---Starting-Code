// include dotenv. file
require('dotenv').config();

//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// make connection with the dabase mongoDB
mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true});


// create a the userSchema
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

// this is the secret key for enncryption password to database
//encryption must before when you input the data into the database


// create a database schema for the userDB
const User = new mongoose.model("User", userSchema);


app.get('/', (req, res) => {
    res.render("home");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', (req, res) => {
    // bcrypt hash
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            password: hash   
        });

        newUser.save().then( () => {
            res.render("secrets");
        }).catch( () => {
            console.log("there was an error");
        });
    }); 
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;    
    
    User.findOne({ email:username })
    .then((foundUser) => {
        if(foundUser){
            // Load hash from your password DB.
            bcrypt.compare(password, foundUser.password).then(function(result) {
                if (result === true) {
                    res.render("secrets");                
                }
            });            
        }
    })
    .catch( () => {
        console.log("your password and username doesn't match, try again");
    console.log(err);
        res.render("/");
    });          
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
