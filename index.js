require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const session = require('express-session');
const passport = require("passport");
const product = require('./models/products');
const methodOverride = require('method-override');
const res = require('express/lib/response');
var GoogleStrategy = require('passport-google-oauth20');
const User = require("./models/user");
var logger = require('morgan');
var SQLiteStore = require('connect-sqlite3')(session);
var csrf = require('csurf');
var createError = require('http-errors');
const connectMongo = require('connect-mongo')
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
const flash = require('connect-flash')


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));


//monogo connect
const dbUrl = 'mongodb+srv://collegebazzar:VAHqO2TA5E4qTj7s@cluster0.gwvlf46.mongodb.net/test';
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error with mongo'));
db.once('open', () => {
  console.log('Connected to Database');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.locals.pluralize = require('pluralize');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const secret = 'niceone';
const store = new connectMongo({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60
})
store.on("error", function (e) {
  console.log('Session store error', e)
})

const sessionConfig = {
  store,
  //name:__dir, //basically it is better not to show defalut name as hacker might be looking for that cookie
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      //secure:true, 
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}
app.use(session(sessionConfig));
app.use(cookieParser())
app.use(flash())

app.use(passport.authenticate('session'));
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});


app.use('/', indexRouter);
app.use('/', authRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// const isAuthor = async (req, res, next) => {
//   const { id } = req.params;
//   const findproduct = await product.findById(id);
//   if (!findproduct.author.equals(req.user._id)) {
//       //req.flash('error', 'You do not have permission to do that!');
//       return res.redirect(`/campgrounds/${id}`)
//   }
//   next();
// }














app.listen(3000, () => {
  console.log('listening on port 3000')
})


