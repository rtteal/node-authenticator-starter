let express = require('express')
let morgan = require('morgan')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let bcrypt = require('bcrypt')
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const SALT = bcrypt.genSaltSync(10)

let app = express()
let flash = require('connect-flash')
app.use(flash())

let user = {
    email: 'foo@foo.com',
    password: bcrypt.hashSync('asdf', SALT)
}

// start server 
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))

// And add the following just before app.listen
// Use ejs for templating, with the default directory /views
app.set('view engine', 'ejs')

// And add your root route after app.listen
app.get('/', (req, res) => {
    res.render('index.ejs', {message: req.flash('error')})
})

// Read cookies, required for sessions
app.use(cookieParser('ilovethenodejs'))            
// Get POST/PUT body information (e.g., from html forms like login)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// In-memory session support, required by passport.session()
app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))

// Use the passport middleware to enable passport
app.use(passport.initialize())

// Enable passport persistent sessions
app.use(passport.session())

app.use(express.static('public'))

// process the login form
app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
}))

passport.use(new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'email',
    // We'll need this later
    failureFlash: true
}, nodeifyit(async (email, password) => {
   if (email !== user.email) {
       return [false, {message: 'Invalid username'}]
   }

   if (!await bcrypt.promise.compare(password, user.password)) {
       return [false, {message: 'Invalid password'}]
   }
   return user
}, {spread: true})))

passport.serializeUser(nodeifyit(async (user) => user.email))
passport.deserializeUser(nodeifyit(async (id) => user))