// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
const Usuario = require("../models/user");
const Asignatura = require("../models/asignatura");

const bcrypt = require('bcrypt-nodejs');

const { ObjectId } = require("mongodb"); // Asegurar uso correcto de ObjectId



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
router.get('/usuarios/addusuarios', isAuthenticated, async (req, res) => {
  if (req.user.role === 2){
    const asignaturas = await Asignatura.find();
    res.render('addusuarios', {
      asignaturas
    }); //Redirige a la página donde se crean los usuarios
  } else {
    res.redirect('/');
  }
})

//Procesar la creación de usuario
router.post('/usuarios/add', isAuthenticated, async (req, res) => {
  if (req.user.role === 2) {
    try {
      const encryptedPassword = bcrypt.hashSync(req.body.password);
      const email = req.body.email;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('createUser', 'The Email is already Taken.');
        return res.redirect('/usuarios'); // Redirige con un mensaje de error
      }

      // Crear nuevo usuario
      const newUser = new User({
        email,
        password: encryptedPassword,
        name: req.body.name,
        lastName: req.body.lastName,
        age: req.body.age,
        role: req.body.role,
        asignaturas: req.body.asignaturas
      });

      const userN = await newUser.save(); // Guardar usuario en la BD
      const userId = userN._id; // El ID ya es un ObjectId, no necesitas convertirlo
      console.log("ID USUARIO ", userId);

      /* AÑADIR USUARIO A LA ARRAY DE ASIGNATURA */
      const asignaturas = req.body.asignaturas;
      console.log("ASIGNATURAS ", asignaturas);

      // AÑADE EL USUARIO A LA LISTA DE USUARIOS DE CADA ASIGNATURA
      try {
        for (const asignaturaId of asignaturas) {
          console.log("ID ASIGNATURA ", asignaturaId);

          const filtro = { _id: asignaturaId };
          const update = { $push: { alumnos: userId } };

          const resultado = await Asignatura.updateOne(filtro, update);
          console.log(`Asignatura ${asignaturaId} actualizada: ${resultado.modifiedCount} documento(s) modificado(s)`);
        }
      } catch (error) {
        console.error("Error al actualizar asignaturas: ", error);
      }

      res.redirect('/usuarios'); // Redirige al listado de usuarios
    } catch (error) {
      console.error("Error al crear el usuario: ", error);
      res.status(500).send("Error al crear el usuario");
    }
  } else {
    res.redirect('/');
  }
});


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
    return res.redirect('/');
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
    return res.redirect('/');
  }
});

//(Administrador) Eliminar Usuario
router.post('/usuarios/delete/:id', isAuthenticated, async (req, res) => {
  if (req.user.role === 2) {
    try {

      const userId = req.params.id;
      console.log("ID USUARIO ", userId);
      /* OBTENER LAS ASIGNATURAS DEL USUARIO */
      const user = new User();
      const asig = await user.findAsignaturas(userId); // Asegurar await
      console.log("ASIGNATURAS ", asig);
      //SI TIENE ASIGNATURAS BORRA EL USUARIO DE LA LISTA DE USUARIOS DE LA ASIGNATURA
      if (asig.length > 0) {
        for (const asignatura of asig) {
          console.log("ID ASIGNATURA ", asignatura.toString());

          const filtro = { _id: new ObjectId(asignatura) };
          const update = { $pull: { alumnos: new ObjectId(userId) } };

          const resultado = await Asignatura.updateMany(filtro, update);
          console.log(`Asignatura ${asignatura} actualizada: ${resultado.modifiedCount} documento(s) modificado(s)`);
        }
      }

      /* ELIMINAR USUARIO */
      const usuario = await User.findByIdAndDelete(userId);
      if (!usuario) {
        return res.redirect('/usuarios'); //Si no se encuentra el usuario, va al listado
      }

      res.redirect('/usuarios');
    } catch (err) {
      console.error("Error al eliminar el usuario:", err);
      res.status(500).send('Error al eliminar el usuario');
    }
  } else {
    return res.redirect('/');
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
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).send('Error al obtener los usuarios');
    }
  } else {
    //res.redirect('/error');
  }
});

//Página Profesores
router.get('/profesores', isAuthenticated, async (req, res) => {
  if (req.user.role === 2) { //Si es un Admin
    try {
      const usuarios = await User.find(); //Obtengo todos los usuarios
      const profesores = []; //Array vacio
      for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].role === 1) { //Si el usuario es un profesor
          profesores.push(usuarios[i]); //Le añado a profesores
        }
      }

      res.render('profesores', { profesores }); //Renderizo la view y le paso los profesores
    } catch (error) {
      console.error("Error al obtener profesores:", error);
      res.status(500).send('Error al obtener los profesores');
    }
  } else {
    //res.redirect('/error');
  }
});


module.exports = router;



