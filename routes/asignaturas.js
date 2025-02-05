const express = require('express');
const router = express.Router();
const Usuario = require('../models/user');
const passport = require("passport");
const Asignaturas = require("../models/asignatura");
const Curso = require("../models/Curso");


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
            const asignaturas = await Asignaturas.find();

            for (const asig of asignaturas){
                const asigId = asig.curso.toHexString();
                const cursoConNombre = await Curso.find({
                    _id: { $in: asigId} },
                    "name"
                );
                console.log(cursoConNombre)
                asig.curso = cursoConNombre[0];
            }
            res.render('asignaturasAdmin', {
                asignaturas
            });
        }catch(err){
            Console.log(err);
        }

    } else {
        res.redirect('/');
    }
});

//(Administrador) Crear Asignatura
//(addasignaturas)
router.get('/asignaturas/addasignaturas', isAuthenticated, (req, res) => {
    if (req.user.role === 2){
        res.render('addasignaturas'); //Redirige a la página donde se crean las asignaturas
    } else {
        res.redirect('/');
    }
})

module.exports = router;