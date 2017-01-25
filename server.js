var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var express = require('express');
var app = express();
var mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var ejs = require('ejs');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

var User = require('./models/user.js');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login' }));

app.get('/register', function(req, res){
  res.render('register');
})

app.post('/register', function(req, res){
  console.log(req.body);
  var user = new User({ username: req.body.username, password: req.body.password });
  user.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/', function(req, res){
  console.log(req.user);
  if(req.user){
    var text = `Welcome, ${req.user.username}!`;
  }
  else{
    text = 'You are not signed in.';
  }
  res.render('index', {text: text});
});

app.listen(3000);