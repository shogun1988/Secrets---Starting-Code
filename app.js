// include dotenv. file
require('dotenv').config();

//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



// make connection with the dabase mongoDB
mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);


// create a the userSchema
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String
});

// these are te plugins 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// create a database schema for the userDB
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOrCreate(id, function (err, user) {
    done(err, user);
  });
});






// include google auth2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACKURL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





app.get('/', (req, res) => {
    res.render("home");
});

app.get('/auth/google', (req, res) => {
  passport.authenticate("google", { scope: ["profile"]} )
});

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });




app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login", (req, res) => {
            req.logout();
            res.redirect("/");
        });
    }
});

app.get("/logout")

app.post('/register', (req, res) => {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local") (req, res, function () {
                res.redirect("/secrets");                
            });
        }        
    });    
});

app.post("/login", (req, res) => {
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, function () {
                res.redirect("/secrets");
            });
        }
    });         
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
