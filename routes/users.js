// routes/users.js
const User = require('../models/user');
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

//PROFILE
router.get('/profile',isAuthenticated ,(req, res, next) => {
  res.render('profile');
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));



//(Administrador) Crear Usuario
//Ruta para mostrar el formulario de creación de usuario (addusuarios)
router.get('/usuarios/addusuarios', isAuthenticated, (req, res) => {
  if (req.user.role === 2){
    res.render('addusuarios'); //Redirige a la página donde se crean los usuarios
  } else {
    res.redirect('/error');
  }
})

//Procesar la creación de usuario
router.post('/usuarios/add', isAuthenticated, async (req, res) => {
  if (req.user.role === 2){
    try{
      const newUser = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        lastName: req.body.lastName,
        age: req.body.age,
        role: req.body.role,
        asignaturas: req.body.asignaturas ? req.body.asignaturas.split(',') : []
      })

      await newUser.save(); //Guardo el usuario en la base de datos
      res.redirect('/usuarios'); //Redirige al listado de usuarios
    }catch (error){
      res.status(500).send("Error al crear el usuario");
    }
  } else {
    res.redirect('/error');
  }
})


//RUTA MANEJAR ERRORES (error.ejs)
router.get('/error', (req, res, next) => {
  res.render('error', {message: req.flash('signupMessage') || req.flash('signinMessage')});
})

function isAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  res.redirect('/')
}

//Página Usuarios
router.get('/usuarios', isAuthenticated, async (req, res) => {
  if (req.user.role === 2) { //Si es un Admin
    try {
      const usuarios = await User.find();  // Obtengo todos los usuarios
      res.render('usuarios', { usuarios }); //Renderizo la view y le paso los usuarios
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      res.status(500).send('Error al obtener los usuarios');
    }
  } else {
    //res.redirect('/error');
  }
});

module.exports = router;



