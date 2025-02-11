const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');
const Usuario = require('../models/user');
const passport = require("passport");
const Curso = require("../models/Curso");
const Cursos = require("../models/Curso");
const Asignatura = require("../models/asignatura");


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
//EDIT
// Ruta para actualizar el usuario **REVISAR ENCRIPTACIÓN**
router.post('/cursos/edit/:id', isAuthenticated, async (req, res) => {
    if (req.user.role === 2) {
        try {
            const { name, year, tipo} = req.body; //Obtengo los datos del formulario
            let updatedCurso = { name, year, tipo};

            const curso = await Curso.findByIdAndUpdate(
                req.params.id,
                updatedCurso,  //Le paso los datos actualizados, incluida la contraseña si se cambió
                { new: true }
            );


            res.redirect('/cursosAdmin');
        } catch (error) {
            console.error("Error al actualizar el curso:", error);
            res.status(500).send('Error al actualizar el curso');
        }
    } else {
        return res.redirect('/');
    }
});

router.get('/cursos/editCurso/:id', isAuthenticated, async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).send('Curso no encontrado');

        res.render('editCurso', { curso });
    } catch (error) {
        console.error("Error al obtener el curso:", error);
        res.status(500).send('Error al cargar la página de edición');
    }
});

router.post('/cursos/delete/:id', isAuthenticated, async (req, res) => {
    if (req.user.role === 2) { // Verificar si el usuario es administrador
        try {
            const cursoId = req.params.id;
            console.log("ID CURSO:", cursoId);

            // 1. Eliminar las asignaturas asociadas al curso
            const asignaturas = await Asignatura.find();//todas las asignaturas
            //  Recorrer las asignaturas y eliminar la referencia al curso
            for (let i = 0; i < asignaturas.length; i++) {
                const asignatura = asignaturas[i];

                // Verificar si la asignatura está asociada al cursoId
                if (asignatura.curso && asignatura.curso.toString() === cursoId) {
                    await Asignatura.findByIdAndUpdate(asignatura.id, {
                        $set: { profesor: [], alumnos: [] }  // Establecer profesores y alumnos como arrays vacíos
                    });
                    console.log(`Asignatura ${asignatura.id} actualizada: profesores y alumnos vacíos.`);

                    // Eliminar la asignatura después de actualizarla
                    await Asignatura.findByIdAndDelete(asignatura.id); // Eliminar la asignatura de la base de datos
                    console.log(`Asignatura ${asignatura._id} eliminada porque estaba asociada al curso ${cursoId}`);
                }
            }

            // Eliminar el curso
            const cursoEliminado = await Curso.findByIdAndDelete(cursoId); // Usar el modelo Curso, no User
            if (!cursoEliminado) {
                return res.status(404).send('Curso no encontrado'); // Si no existe el curso, devolver error 404
            }
            console.log(`Curso ${cursoId} eliminado.`);

            res.redirect('/cursosAdmin'); // Redirigir al listado de cursos
        } catch (error) {
            console.error("Error al eliminar el curso:", error);
            res.status(500).send('Error al eliminar el curso');
        }
    } else {
        return res.redirect('/'); // Si no es administrador, redirigir a la página principal
    }
});

module.exports = router;

