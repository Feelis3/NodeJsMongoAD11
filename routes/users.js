// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {isAuthenticated} = require("passport/lib/http/request");
router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/signin', (req, res, next) => {
  res.render('signin'); // Asegúrate de que la vista signin.ejs exista
});

router.post('/signin', passport.authenticate('local-signin', {
  successRedirect: '/',
  failureRedirect: '/signin',
  failureFlash: true
}));


//CERRAR SESION
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

//REGISTRARSE
router.get('/signup', (req, res, next) => {
  res.render('signup');
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));

//Añadir usuario
router.post('/usuarios/add', passport.authenticate('local-signup', { //Verifico registro
  successRedirect: '/usuarios', //Éxito -> página usuarios
  failureRedirect: '/usuarios/registrousuarios', //Fallo -> vuelve a la página para registrarse de nuevo
  failureFlash: true
}))

router.get('usuarios/registrousuarios', isAuthenticated, async (req, res, next) => {
  if (req.user.role == "0") { //Si el usuario es un Admin
    var usuario = new Usuario(); //Para interactuar con usuarios
    //¿Añadir asignatura?

    //await se utiliza para esperar a que algo se cumpla
    usuario = await usuario.findById(req.params.id); //Devuelve un usuario

    //Genero la página html para el cliente
    res.render('registrousuarios.ejs', usuario) //-ejs es la página a renderizar, le paso el usuario
  } else {
    return res.redirect('/perfilusuario'); //Si no es un admin le mando a ver su perfil
  }
})


//RUTA MANEJAR ERRORES (error.ejs)
router.get('/error', (req, res, next) => {
  res.render('error', {message: req.flash('signupMessage') || req.flash('signinMessage')});
})

module.exports = router;