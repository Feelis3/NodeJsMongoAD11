const express = require('express');
const router = express.Router();
const Software = require("../models/software");
const Asignatura = require("../models/asignatura");

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }

    res.redirect('/')
}

//Carga la vista que muestra los enlaces de la asignatura
router.get('/asignaturas/softwares/:id', isAuthenticated, async (req, res) => {
    try {
        //Cargo los softwares de la asignatura y se los paso a la vista
        console.log(req.params.id);
        const asignatura = await Asignatura.findById(req.params.id);
        console.log('Softwares de la asignatura:', asignatura);
        if (!asignatura) return res.status(404).send('Asignatura no encontrada');

        const softwares = await Software.find({asignatura: asignatura.id});
        res.render('softwares', {
            softwares,
            asignatura
        });
    } catch (error) {
        console.error("Error al obtener los softwares:", error);
        res.status(500).send('Error al cargar la página de softwares');
    }
})

router.get('/asignaturas/softwares/editSoftware/:id', isAuthenticated, async (req, res) => {
    if (req.user.role >= 1){
        try {
            const software = await Software.findById(req.params.id);
            res.render('editSoftware', {
                software
            });
        } catch (error) {
            console.error("Error al obtener el software:", error);
            res.status(500).send('Error al cargar la página de edición del software');
        }
    }else {
        return res.redirect('/');
    }
})

router.post('/asignaturas/softwares/edit/:id', isAuthenticated, async (req, res) => {
    if (req.user.role >= 1){
        try {
            const software = await Software.findByIdAndUpdate(req.params.id, req.body, {new: true});
            res.redirect(`/asignaturas/softwares/${software.asignatura}`);
        } catch (error) {
            console.error("Error al actualizar el software:", error);
            res.status(500).send('Error al actualizar el software');
        }
    } else {
        return res.redirect('/');
    }
})

router.post('/asignaturas/softwares/:id/add', isAuthenticated, async (req, res) => {
    if (req.user.role >= 1){
        try {
            console.log(req.body.descripcion)
            console.log(req.body.direccion)
            console.log(req.params.id)

            const software = new Software({
                    direccion : req.body.direccion,
                    descripcion : req.body.descripcion,
                    asignatura : req.params.id
            }

            );
            await software.save();
            res.redirect(`/asignaturas/softwares/${req.params.id}`);
        } catch (error) {
            console.error("Error al crear el software:", error);
            res.status(500).send('Error al crear el software');
        }
    } else {
        return res.redirect('/');
    }
})

router.post('/asignaturas/softwares/delete/:id', isAuthenticated, async (req, res) => {
    if (req.user.role >= 1){
        try {
            await Software.findByIdAndDelete(req.params.id);
            res.redirect('/asignaturas');
        } catch (error) {
            console.error("Error al eliminar el software:", error);
            res.status(500).send('Error al eliminar el software');
        }
    } else {
        return res.redirect('/');
    }
})

module.exports = router;