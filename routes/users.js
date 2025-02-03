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
  successRedirect: '/index.ejs',
  failureRedirect: '/error',
  failureFlash: true
}));

module.exports = router;