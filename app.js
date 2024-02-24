const express = require('express')
const path = require('path')
const session = require('express-session')
const passport = require('passport')
// const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const bcrypt = require('bcryptjs')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
// const { truncate } = require('fs')
// const Schema = mongoose.Schema
const User = require('./models/User')
require("dotenv").config()


require('./config/passport')

const mongoDB = process.env.mongoDB
mongoose.connect(mongoDB)
const db = mongoose.connection

db.on('error', console.error.bind(console, 'mongoose connection error'))

const app = express();
const sessionStore = new MongoStore({
    mongoUrl: mongoDB,
    dbName: "Auth",
    collectionName: "sessions"
})

app.use(
    session({
        secret: process.env.secret,
        name: "session-id",
        store: sessionStore,
        saveUninitialized: false, 
        resave: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            secure: false,
        },
    })
);


app.use(passport.initialize())
app.use(passport.session()) 
app.use(express.urlencoded({
    extended: false
}))

app.use(cors({
    credentials: true,
    origin: process.env.origin,
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser(process.env.secret))


app.get('/', (req, res) => {
    // make a get request to check access to server
    res.status(200).json({message: "Connection to server confirmed."})
})

app.post('/login', function(req, res, next) {
    passport.authenticate('local', async function(err, user) {
        if (err) { return next(err); }
        if (!user) { return res.status(401).json({message: "Incorrect username or password."}); }
        req.login(user, function() {
            req.session.active = true
            res.status(200).json({message: "Successfully logged in."})
        })
    })(req, res, next)
});


app.post('/register', async(req, res, next) => {
    bcrypt.hash(req.body.password, 10, async(err, hashedPassword) => {
        if(err) {
            return next(err)
        }
        try {
            console.log(req.body.username, hashedPassword)
            const user = new User({
                username: req.body.username,
                password: hashedPassword
            });
            await user.save();
            res.status(200)
        } catch {
            return next(err)
        }
    })

})

app.post("/logout", (req, res, next) => {
    req.logout(function(err) {
        if(err) {
            return next(err)
        }
        req.session.destroy(function(err) {
            if(err) {
              console.log(err); 
            } else {
              res.status(200).clearCookie('connect.sid', { path: '/' }).json({message: "Successfully logged out."}); 
            }
          });
    })
})

app.get('/test', isAuth, (req, res, next) => {
    res.json({message: "Authorized."})
})

function isAuth(req, res, next) {
    if(req.isAuthenticated()) {
        next()
    } else {
        res.send(403).json({message: "Not authorized."})
    }
}

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`New app listening on port ${port}`))