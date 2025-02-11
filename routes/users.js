// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
const Usuario = require("../models/user");
const Asignatura = require("../models/asignatura");

const bcrypt = require('bcrypt-nodejs');

const { ObjectId } = require("mongodb");
const Curso = require("../models/Curso");
const child_process = require("node:child_process"); // Asegurar uso correcto de ObjectId



router.get('/', async (req, res, next) => {
  if (req.isAuthenticated()) { // Verifica si el usuario está autenticado
    console.log("Usuario autenticado"); // Log para saber si entra en el if
    const user = new Usuario();
    const tasks = await user.findAsignaturas(req.user._id);
    const asignaturasUsuario= [];

    //Consigue el nombre del curso
    for (const asig of tasks){
      const asigId = asig.curso.toHexString();
      const cursoConNombre = await Curso.find({
            _id: { $in: asigId} },
          "name"
      );

      //Profesores
      const profesores =  asig.profesor;
      const nombresProfesores = [];
      for (let i = 0;i<profesores.length; i++){
        const profe = await Usuario.findById(profesores[i].toString());
        nombresProfesores.push(profe.name);
      }

      asig.curso = cursoConNombre[0];

      const asignaturaNueva = {
        name: asig.nombre,
        curso: asig.curso,
        profesores: nombresProfesores
      }
      asignaturasUsuario.push(asignaturaNueva);


    }
    res.render('index', { asignaturasUsuario });
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

  const asignaturasUsuario= [];

  //Consigue el nombre del curso
  for (const asig of tasks){
    const asigId = asig.curso.toHexString();
    const cursoConNombre = await Curso.find({
          _id: { $in: asigId} },
        "name"
    );

    //Profesores
    const profesores =  asig.profesor;
    const nombresProfesores = [];
    for (let i = 0;i<profesores.length; i++){
      const profe = await Usuario.findById(profesores[i].toString());
      nombresProfesores.push(profe.name);
    }

    asig.curso = cursoConNombre[0];

    const asignaturaNueva = {
      name: asig.nombre,
      curso: asig.curso,
      profesores: nombresProfesores
    }
    asignaturasUsuario.push(asignaturaNueva);
  }

  res.render('profile', {
    asignaturasUsuario
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
      const asignaturas = Array.isArray(req.body.asignaturas)
          ? req.body.asignaturas
          : [req.body.asignaturas];

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
        res.render('usuarios');
      }
      const asignaturas = await Asignatura.find();

      res.render('editusuarios', {usuario,asignaturas});
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
      const { email, name, lastName, age, role, asignaturas } = req.body; //Obtengo los datos del formulario
      let updatedUser = { email, name, lastName, age, role, asignaturas };

      //COMPRUEBA QUE EL CORREO AL EDITAR ES DIFERENTE A UNO EQUE EXISTE Y NO SALTE ERROR SI EL QUE EXISTE ES EL ANTIGUO
      const existingUser = await User.findOne({ email });
      const antiguoEmail = await User.findById(req.params.id);
      let tieneAsignatura = false;
      if(antiguoEmail.role === 1&&updatedUser.role !=1){
        const asignaturas = await Asignatura.find();
        const resultado = Array.isArray(asignaturas) ? asignaturas : [asignaturas];
        for (const asignatura of asignaturas) {
          for(const profesor of asignatura.profesor){
            if(profesor.toString() === antiguoEmail._id.toString()){
              tieneAsignatura = true;
              break;
            }
          }
          if(tieneAsignatura) break;
        }
        if(tieneAsignatura){
          req.flash('editUser', 'El usuario tiene asignaturas, no se puede modificar.');
          return res.redirect('/usuarios');
        }

      }
      if (existingUser && existingUser.email !== antiguoEmail.email ) {
        req.flash('editUser', 'The Email is already Taken.');
        return res.redirect('/usuarios'); // Redirige con un mensaje de error
      }


      //QUITAR DE LAS LISTAS DE ASIGNATURA Y AÑADIR A LISTA DE ASIGNATURA EL USUARIO
      //ESTAS VARIABLES SE ASEGURAN QUE LE LLEGUE COMO ARRAY
      const asignaturasAntiguaUpdateUser = Array.isArray(req.body.asignaturas)
          ? req.body.asignaturas
          : [req.body.asignaturas];
      const asignaturasNuevasUpdateUser= Array.isArray(updatedUser.asignaturas)
          ? updatedUser.asignaturas
          : [updatedUser.asignaturas];
      const asignaturasNuevasExistingUser= Array.isArray(existingUser.asignaturas)
          ? existingUser.asignaturas
          : [existingUser.asignaturas];


      if(updatedUser.role==0) {
        //Añadir usuario a la asignatura donde se haya añadido
        const asignaturasNuevas = asignaturasAntiguaUpdateUser.filter(item => !asignaturasNuevasExistingUser.includes(item));
        if(asignaturasNuevas.length > 0) {
          for (const asignaturaId of asignaturasNuevas) {
            await Asignatura.updateOne( { _id: asignaturaId }, { $push: { alumnos: req.params.id } });
          }
        }

        const asignaturasQuitar = asignaturasNuevasExistingUser
            .map(obj => obj.toString()) // Convertimos los ObjectId a string
            .filter(item => !asignaturasNuevasUpdateUser.includes(item));

        for (const asignaturaId of asignaturasQuitar) {
          const filtro = { _id: new ObjectId(asignaturaId) };
          const update = { $pull: { alumnos: new ObjectId(req.params.id) } };
          const resultado = await Asignatura.updateOne(filtro, update);
          console.log(`Asignatura actualizada: ${resultado.modifiedCount} documento(s) modificado(s)`);
        }

      }

//SI ES PROFESOR O ADMINISTRADOR LOS SACA DE LA ASIGNATURA
      if(updatedUser.role==1||updatedUser.role==2){
        updatedUser.asignaturas = [];
        for (const asignatura of asignaturasNuevasUpdateUser) {
          const filtro = { _id: new ObjectId(asignatura) };
          const update = { $pull: { alumnos: new ObjectId(req.params.id) } };
          const resultado = await Asignatura.updateOne(filtro, update);
          console.log(`Asignatura actualizada: ${resultado.modifiedCount} documento(s) modificado(s)`);
        }
      }

      
      //ACTUALIZA
      const usuario = await User.findByIdAndUpdate(
          req.params.id,
          updatedUser,
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

      //COMPROBAR QUE ES PROFESOR
      const userRole = await User.findById(userId);

      let tieneAsignatura = false;
      if(userRole.role === 1){
        const asignaturasProfesor = await Asignatura.find();
        const resultado = Array.isArray(asignaturasProfesor) ? asignaturasProfesor : [asignaturasProfesor];
        for (const asignatura of asignaturasProfesor) {
          for(const profesor of asignatura.profesor){
            if(profesor.toString() === userRole._id.toString()){
              tieneAsignatura = true;
              break;
            }
          }
          if(tieneAsignatura) break;
        }
        if(tieneAsignatura){
          req.flash('editUser', 'El usuario tiene asignaturas, no se puede modificar.');
          return res.redirect('/usuarios');
        }

      }

      /* OBTENER LAS ASIGNATURAS DEL USUARIO */
      const user = new User();
      const asig = await user.findAsignaturas(userId); // Asegurar await
      console.log("ASIGNATURAS ", asig);
      //SI TIENE ASIGNATURAS BORRA EL USUARIO DE LA LISTA DE USUARIOS DE LA ASIGNATURA
      if(userRole.role === 1){

        req.flash('editUser', 'El usuario tiene asignaturas, no se puede modificar.');
        return res.redirect('/usuarios');
      }


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

//Página Alumno
router.get('/alumnos', isAuthenticated, async (req, res) => {

  if (req.user.role === 2) { //Si es un Admin
    try {
      const usuarios = await User.find(); //Obtengo todos los usuarios
      const alumnos = []; //Array vacio
      for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].role === 0) { //Si el usuario es un profesor
          alumnos.push(usuarios[i]); //Le añado a profesores
        }
      }

      res.render('alumnos', { alumnos }); //Renderizo la view y le paso los profesores
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
      res.status(500).send('Error al obtener los profesores');
    }
  } else {
    //res.redirect('/error');
  }
});

//Página Alumno
router.get('/administradores', isAuthenticated, async (req, res) => {

  if (req.user.role === 2) { //Si es un Admin
    try {
      const usuarios = await User.find(); //Obtengo todos los usuarios
      const admin = []; //Array vacio
      for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].role === 2) { //Si el usuario es un profesor
          admin.push(usuarios[i]); //Le añado a profesores
        }
      }

      res.render('administradores', { admin }); //Renderizo la view y le paso los profesores
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      res.status(500).send('Error al obtener los profesores');
    }
  } else {
    //res.redirect('/error');
  }
});


module.exports = router;



