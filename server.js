var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var ejs = require('ejs');
var flash = require('connect-flash');

var mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
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

app.get('/', function(req, res){
  if(req.user){
    var text = `Welcome, ${req.user.username}!`;
    var signedIn = true;
  }
  else{
    text = 'You are not signed in.';
    signedIn = false;
  }
  res.render('index', {text: text, signedIn: signedIn});
});

app.get('/login', function(req, res){
  res.render('login', {message: req.flash('error')});
});

app.get('/register', function(req, res){
  res.render('register');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/profile', function(req, res){
  if(!req.user){
    res.redirect('/login');
  }
  else{
    res.render('profile', {name: req.user.username});
  }
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true }));

app.post('/register', function(req, res){
  User.find({username: req.body.username}, function(err, users){
    if(err) throw err;
    if(users.length == 0){
      var user = new User({ username: req.body.username, password: req.body.password });
      user.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          req.login(user, function(err){
            if(err) throw err;
            res.redirect('/');
          });
        }
      });
    }
    else{
      res.redirect('/register');
    }
  });
});

app.delete('/deleteuser', function(req, res){
  User.findByIdAndRemove(req.user._id, function (err,user){
    if(err) throw err;
    res.end('successfully deleted user');
  });
});

app.listen(process.env.PORT);