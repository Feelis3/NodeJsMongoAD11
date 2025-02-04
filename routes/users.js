// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
const Usuario = require("../models/user");

router.get('/', async (req, res, next) => {
  if (req.isAuthenticated()) { // Verifica si el usuario está autenticado
    console.log("Usuario autenticado"); // Log para saber si entra en el if
    const user = new Usuario();
    const tasks = await user.findAsignaturas(req.user._id);
    res.render('index', { tasks });
  } else {
    console.log("Usuario no autenticado"); // Log para saber si entra en el else
    res.render('index'); // Si no está autenticado, solo renderiza la página sin las asignaturas
  }

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
router.get('/profile',isAuthenticated , async (req, res, next) => {
  const user = new Usuario();
  const tasks = await user.findAsignaturas(req.user._id);
  res.render('profile', {
    tasks
  });
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));



//(Administrador) Crear Usuario
//(addusuarios)
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
      const encryptedPassword = bcrypt.hashSync(req.body.password);

      const newUser = new User({
        email: req.body.email,
        password: encryptedPassword,
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

//(Administrador) Editar Usuario
router.get('/usuarios/editusuarios/:id', isAuthenticated, async (req, res) => {
  if (req.user.role === 2){
    try {
      const usuario = await User.findById(req.params.id); //Busco usuario por ID

      if (!usuario) {
        return res.redirect('/usuarios'); //Si no se encuentra el usuario vuelve a la lista de usuarios
      }

      res.render('editusuarios', {usuario});
    } catch (error) {
      res.status(500).send("Error al obtener el usuario");
    }
  } else {
    return res.redirect('/error');
  }
})

// Ruta para actualizar el usuario **REVISAR ENCRIPTACIÓN**
router.post('/usuarios/edit/:id', isAuthenticated, async (req, res) => {
  if (req.user.role === 2) {
    try {
      const { email, password, name, lastName, age, role } = req.body; //Obtengo los datos del formulario
      let updatedUser = { email, name, lastName, age, role };

      if (password) {
        updatedUser.password = await bcrypt.hashSync(req.body.password); // Encriptar la nueva contraseña, puedo que no haga falta
      }

      const usuario = await User.findByIdAndUpdate(
          req.params.id,
          updatedUser,  //Le paso los datos actualizados, incluida la contraseña si se cambió
          { new: true }
      );

      if (!usuario) {
        return res.redirect('/usuarios');  //Si no se encuentra el usuario, redirigir al listado
      }

      res.redirect('/usuarios');
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      res.status(500).send('Error al actualizar el usuario');
    }
  } else {
    return res.redirect('/error');
  }
});

//(Administrador) Eliminar Usuario
router.post('/usuarios/delete/:id', isAuthenticated, async (req, res) => {
  if (req.user.role === 2) {
    try {
      const usuario = await User.findByIdAndDelete(req.params.id);

      if (!usuario) {
        return res.redirect('/usuarios'); //Si no se encuentra el usuario, va al listado
      }

      res.redirect('/usuarios');
    } catch (err) {
      console.error("Error al eliminar el usuario:", err);
      res.status(500).send('Error al eliminar el usuario');
    }
  } else {
    return res.redirect('/error');
  }
});



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



