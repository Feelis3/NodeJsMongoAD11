// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/signin', (req, res, next) => {
  res.render('signin'); // Asegúrate de que la vista signin.ejs exista
});

router.post('/signin', passport.authenticate('local-signin', {
  successRedirect: '/',
  failureRedirect: '/error',
  failureFlash: true
}));


//REGISTRARSE
router.get('/signup', (req, res, next) => {
  res.render('signup');
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/error',
  failureFlash: true
})); 

module.exports = router;