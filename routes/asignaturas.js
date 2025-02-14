const express = require('express');
const router = express.Router();
const Usuario = require('../models/user');
const passport = require("passport");
const Asignaturas = require("../models/asignatura");
const Asignatura = require("../models/asignatura");
const Curso = require("../models/Curso");
const Cursos = require("../models/Curso");



router.get('/asignaturas',isAuthenticated, async (req, res) => {
    const user = new Usuario();
    const usuario = await Usuario.findById(req.user._id);
    var tasks = [];
    const asignaturasUsuario= [];
    if (usuario.role === 0){
        tasks = await user.findAsignaturas(req.user._id);
    }else if (usuario.role === 1){
        const allAsignaturas = await Asignatura.find();
        for (const asig of allAsignaturas){
            console.log(asig);
            if (asig.profesor.includes(req.user._id)){
                tasks.push(asig);
            }
        }
    }
    //Bucle para formatear los nombres de las asignaturas y profesores
    for (const asig of tasks){
        const asigId = asig.curso.toHexString();

        //Nombre curso
        const cursoConNombre = await Curso.find({
                _id: { $in: asigId} },
            "name"
        );
        asig.curso = cursoConNombre[0];

        //Profesores nombres
        const profesores =  asig.profesor;
        const nombresProfesores = [];
        for (let i = 0;i<profesores.length; i++){
            const profe = await Usuario.findById(profesores[i].toString());
            nombresProfesores.push(profe.name);
        }

        //Alumnos
        // Convertir los IDs en strings
        const alumnosIds = asig.alumnos.map(id => id.toHexString());

        // Obtener todos los alumnos con `name` y `lastname`
        const alumnosConNombres = await Usuario.find(
            { _id: { $in: alumnosIds } },
            "name lastName" // <-- Aquí agregamos lastname
        );

        const asignaturaNueva = {
            id: asig._id,
            name: asig.nombre,
            curso: asig.curso,
            alumnos: alumnosConNombres,
            profesores: nombresProfesores
        }

        asignaturasUsuario.push(asignaturaNueva);


    }

    res.render('asignaturas', {
        asignaturasUsuario
    });
});

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }

    res.redirect('/')
}

//GET

router.get('/asignaturasAdmin', isAuthenticated, async (req, res, next) => {
    if (req.user.role === 2){
        try {
            // Poblar las referencias de curso
            const asignaturas = await Asignaturas.find()
                .populate('curso', 'name')  // Poblar solo el campo 'name' del curso
                .populate('profesor', 'name');  // También poblar el nombre del profesor si es necesario


            res.render('asignaturasAdmin', {
                asignaturas
            });
        } catch (err) {
            console.log(err);
        }

    } else {
        res.redirect('/');
    }
});

//(Administrador) Crear Asignatura
//(addasignaturas)
router.get('/asignaturas/addasignaturas', isAuthenticated, async (req, res) => {
    if (req.user.role === 2){
        const cursos = await Cursos.find();
        const usuar = await Usuario.find();
        const profesores = [];
        usuar.forEach((user) => {
            if (user.role === 1){
                profesores.push(user);
            }
        })

        profesores.forEach(profesore => {
            console.log(profesore);
        })
        res.render('addasignaturas', {
            cursos, profesores
        }); //Redirige a la página donde se crean las asignaturas
    } else {
        res.redirect('/');
    }
})

//Procesar la creación de Asignaturas
router.post('/asignaturas/add', isAuthenticated, async (req, res) => {
    if (req.user.role === 2){
        try{
            const newAsignatura = new Asignatura({
                nombre: req.body.nombre,
                curso: req.body.curso,
                alumnos: [],
                profesor: req.body.profesor
            })

            await newAsignatura.save(); //Guardo el Curso en la base de datos
            res.redirect('/asignaturasAdmin'); //Redirige al listado de cursos
        }catch (error){
            req.flash('errorAsignatura', 'No hay curso selecionado.');
            return res.redirect('/asignaturasAdmin'); // Redirige con un mensaje de error
        }
    } else {
        res.redirect('/');
    }
})

//EDIT
router.get('/asignaturas/editAsignaturas/:id', isAuthenticated, async (req, res) => {
    try {
        //Cambio el if para que puedan actualizar también profesores
        if (req.user.role >= 1) {
            const asignatura = await Asignatura.findById(req.params.id);
            if (!asignatura) return res.status(404).send('Asignatura no encontrada');
            const cursos = await Cursos.find();
            const usuar = await Usuario.find();
            const profesores = [];
            usuar.forEach((user) => {
                if (user.role === 1) {
                    profesores.push(user);
                }
            })
            profesores.forEach(profesore => {
                console.log(profesore);
            })
            res.render('editAsignaturas', {
                cursos, profesores, asignatura
            });
        }
    } catch (error) {
        console.error("Error al obtener la asignatura:", error);
        res.status(500).send('Error al cargar la página de edición');
    }
});

router.post('/asignaturas/edit/:id', isAuthenticated, async (req, res) => {
    //Cambio el if para que puedan actualizar también profesores
    if (req.user.role >= 1) {
        try {
            const { nombre, profesor, curso} = req.body; //Obtengo los datos del formulario
            let updatedAsignatura = { nombre, profesor, curso};

            const asignatura = await Asignatura.findByIdAndUpdate(
                req.params.id,
                updatedAsignatura,  //Le paso los datos actualizados, incluida la contraseña si se cambió
                { new: true }
            );

            //Al terminar de editar compruebo si es profesor o admin para redirigir a asignaturasAdmin o al contenido de la asignatura
            if (req.user.role === 1){
                res.redirect("/asignaturas/softwares/" + req.params.id);
            } else {
                res.redirect('/asignaturasAdmin');
            }
        } catch (error) {
            console.error("Error al actualizar la asignatura:", error);
            res.status(500).send('Error al actualizar la asignatura');
        }
    } else {
        return res.redirect('/');
    }
});

router.post('/asignaturas/delete/:id', isAuthenticated, async (req, res) => {
    if (req.user.role === 2) { // Verificar si el usuario es administrador
        try {
            const asignaturaID = req.params.id;
            console.log("ID Asignatura:", asignaturaID);

            // Obtener todos los usuarios
            const usuarios = await Usuario.find();

            // Recorrer todos los usuarios y eliminar la asignatura de su lista
            for (let i = 0; i < usuarios.length; i++) {
                const usuario = usuarios[i];

                // Verificar si el usuario tiene esta asignatura en su array
                if (usuario.asignaturas && usuario.asignaturas.some(asigId => asigId.toString() === asignaturaID)) {
                    await Usuario.findByIdAndUpdate(usuario._id, {
                        $pull: { asignaturas: asignaturaID }
                    });
                    console.log(`Asignatura ${asignaturaID} eliminada del usuario ${usuario._id}`);
                }
            }

            // Vaciar profesores y alumnos de la asignatura antes de eliminarla
            await Asignatura.findByIdAndUpdate(asignaturaID, {
                $set: { profesor: [], alumnos: [] }
            });
            console.log(`Asignatura ${asignaturaID} actualizada: profesores y alumnos vacíos.`);

            // Eliminar la asignatura después de actualizarla
            await Asignatura.findByIdAndDelete(asignaturaID);
            console.log(`Asignatura ${asignaturaID} eliminada correctamente.`);

            res.redirect('/asignaturasAdmin'); // Redirigir al listado de asignaturas
        } catch (error) {
            console.error("Error al eliminar la asignatura:", error);
            res.status(500).send('Error al eliminar la asignatura');
        }
    } else {
        return res.redirect('/'); // Si no es administrador, redirigir a la página principal
    }
});


module.exports = router;