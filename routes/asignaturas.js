const express = require('express');
const router = express.Router();
const Usuario = require('../models/user');
const passport = require("passport");
const Asignaturas = require("../models/asignatura");


router.get('/asignaturas',isAuthenticated, async (req, res) => {
    const user = new Usuario();
    const tasks = await user.findAsignaturas(req.user._id);
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

module.exports = router;