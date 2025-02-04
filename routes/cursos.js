const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');
const Usuario = require('../models/user');
const passport = require("passport");
const Curso = require("../models/Curso");
const Cursos = require("../models/Curso");

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }

    res.redirect('/')
}

//GET

router.get('/cursosAdmin', isAuthenticated, async (req, res, next) => {
    if (req.user.role === 2){
        const cursos = await Cursos.find();
            res.render('cursosAdmin', {
                cursos
            });
    } else {
        res.redirect('/');
    }
});

//(Administrador) Crear cursos
//(addcursos)
router.get('/cursos/addcursos', isAuthenticated, (req, res) => {
    if (req.user.role === 2){
        res.render('addcursos'); //Redirige a la página donde se crean los cursos
    } else {
        res.redirect('/');
    }
})

//Procesar la creación de cursos
router.post('/cursos/add', isAuthenticated, async (req, res) => {
    if (req.user.role === 2){
        try{

            const newCurso = new Curso({
                name: req.body.name,
                year: req.body.year,
                tipo: req.body.tipo,
            })

            await newCurso.save(); //Guardo el Curso en la base de datos
            res.redirect('/cursosAdmin'); //Redirige al listado de cursos
        }catch (error){
            console.error('Error al crear el curso:', error.message);
            res.status(500).send("Error al crear el curso");
        }
    } else {
        res.redirect('/');
    }
})

module.exports = router;