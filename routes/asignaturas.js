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
    const tasks = await user.findAsignaturas(req.user._id);
    //Nombre del curso
    for (const asig of tasks){
        const asigId = asig.curso.toHexString();
        const cursoConNombre = await Curso.find({
                _id: { $in: asigId} },
            "name"
        );
        console.log("CURSO :..",cursoConNombre)
        asig.curso = cursoConNombre[0];
    }
    //Nombre de la asignatura
    for (const asignatura of tasks) {
        console.log(asignatura.alumnos);

        // Convertir los IDs en strings
        const alumnosIds = asignatura.alumnos.map(id => id.toHexString());

        // Obtener todos los alumnos con `name` y `lastname`
        const alumnosConNombres = await Usuario.find(
            { _id: { $in: alumnosIds } },
            "name lastName" // <-- Aquí agregamos lastname
        );
        console.log(alumnosConNombres);

        asignatura.alumnos = alumnosConNombres;
    }
    res.render('asignaturas', {
        tasks
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
            console.error('Error al crear la asignatura:', error.message);
            res.status(500).send("Error al crear la asignatura");
        }
    } else {
        res.redirect('/');
    }
})

//EDIT
router.get('/asignaturas/editAsignaturas/:id', isAuthenticated, async (req, res) => {
    try {
        if (req.user.role === 2) {
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
    if (req.user.role === 2) {
        try {
            const { nombre, profesor, curso} = req.body; //Obtengo los datos del formulario
            let updatedAsignatura = { nombre, profesor, curso};

            const asignatura = await Asignatura.findByIdAndUpdate(
                req.params.id,
                updatedAsignatura,  //Le paso los datos actualizados, incluida la contraseña si se cambió
                { new: true }
            );


            res.redirect('/asignaturasAdmin');
        } catch (error) {
            console.error("Error al actualizar la asignatura:", error);
            res.status(500).send('Error al actualizar la asignatura');
        }
    } else {
        return res.redirect('/');
    }
});

module.exports = router;