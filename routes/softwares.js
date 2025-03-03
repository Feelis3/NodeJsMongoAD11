const express = require('express');
const Software = require("../models/software");
const Asignatura = require("../models/asignatura");
const fs = require('fs') //fileSystem
const path = require('path');
const nodemailer = require('nodemailer');
const router = express.Router();

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }

    res.redirect('/')
}

//Carga la vista que muestra los enlaces de la asignatura
router.get('/asignaturas/softwares/:id', isAuthenticated, async (req, res) => {


    try {
        const asignatura = await Asignatura.findById(req.params.id);
        if (!asignatura) return res.status(404).send('Asignatura no encontrada');
        const user = req.user;
        var laTiene = false;
        if (user.role === 0){
            for (const asignatura of user.asignaturas) {
                if (asignatura.equals(req.params.id)) {
                    laTiene = true;
                    break;
                }
            }
            if (!laTiene) {
                res.redirect("/");
            }
        }

        //Cargo los softwares de la asignatura y se los paso a la vista
        console.log(req.params.id);
        if (user.role === 1){
            for (let profesor of asignatura.profesor) {
                if (profesor.equals(user._id)){
                    laTiene = true;
                    break;
                }
            }
            if (!laTiene) {
                res.redirect("/");
            }
        }

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


router.post('/asignaturas/softwares/edit/:id', isAuthenticated, async (req, res) => {
    if (req.user.role >= 1) {
        try {
            // Obtener el software antes de actualizar
            let software = await Software.findById(req.params.id);
            if (!software) {
                return res.status(404).send('Software no encontrado');
            }

            let archivoAnterior = software.archivo; // Guardamos el archivo antiguo
            let idAsignatura = software.asignatura; // ID de la asignatura para la redirección


            Object.keys(req.body).forEach(key => {
                if (key !== 'archivo') {
                    software[key] = req.body[key];
                }
            });

            if (req.files && req.files.archivo) {
                let EDFile = req.files.archivo;
                let extension = path.extname(EDFile.name);
                let nombreBase = path.basename(EDFile.name, extension);
                let timestamp = Date.now();
                let nuevoNombre = `${nombreBase}_${timestamp}${extension}`;

                if (archivoAnterior) {
                    const rutaArchivoAntiguo = path.join(__dirname, '..', 'files', archivoAnterior);
                    if (fs.existsSync(rutaArchivoAntiguo)) {
                        fs.unlinkSync(rutaArchivoAntiguo);
                        console.log("Archivo antiguo eliminado:", archivoAnterior);
                    }
                }

                // Guardar el nuevo archivo
                await EDFile.mv(`./files/${nuevoNombre}`);
                console.log("Nuevo archivo guardado:", nuevoNombre);

                software.archivo = nuevoNombre;
            }

            await software.save();

            res.redirect(`/asignaturas/softwares/${idAsignatura}`);
        } catch (error) {
            console.error("Error al actualizar el software:", error);
            res.status(500).send('Error al actualizar el software');
        }
    } else {
        return res.redirect('/');
    }
});


router.post('/asignaturas/softwares/:id/add', isAuthenticated, async (req, res) => {
    if (req.user.role >= 1){
        try {
            console.log(req.body.descripcion)
            console.log(req.body.direccion)
            console.log(req.params.id)

            const software = new Software({
                    direccion : req.body.direccion,
                    descripcion : req.body.descripcion,
                    asignatura : req.params.id,

            });

            //Archivo
            if (req.files && req.files.archivo) {
                let EDFile = req.files.archivo;

                let extension = path.extname(EDFile.name);

                let nombreBase = path.basename(EDFile.name, extension);

                let timestamp = Date.now(); // Milisegundos actuales

                let nuevoNombre = `${nombreBase}_${timestamp}${extension}`;

                // Guardar el archivo con el nuevo nombre
                await EDFile.mv(`./files/${nuevoNombre}`);

                software.archivo = nuevoNombre;
            } else {
                console.error('No se ha recibido ningún archivo');
            }


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
    if (req.user.role >= 1) {
        try {
            const software = await Software.findById(req.params.id);
            if (!software) {
                return res.status(404).send('Software no encontrado');
            }

            const idAsignatura = software.asignatura;

            //Solo borra si existe archivo
            if (software.archivo) {
                const rutaArchivo = path.join(__dirname, '..', 'files', software.archivo);

                if (fs.existsSync(rutaArchivo)) {
                    fs.unlinkSync(rutaArchivo);
                    console.log("Archivo eliminado:", software.archivo);
                } else {
                    console.log("El archivo no existe:", software.archivo);
                }
            } else {
                console.log("El software no tiene un archivo asociado.");
            }


            await Software.findByIdAndDelete(req.params.id);

            res.redirect('/asignaturas/softwares/' + idAsignatura);
        } catch (error) {
            console.error("Error al eliminar el software:", error);
            res.status(500).send('Error al eliminar el software');
        }
    } else {
        return res.redirect('/');
    }
})





router.post('/enviar-correo/:id', async (req, res) => {
    try {
        const { mensaje } = req.body;
        const asignaturaId = req.params.id;

        // 1Buscar la asignatura y obtener la lista de profesores
        const asignatura = await Asignatura.findById(asignaturaId).populate('profesor');

        if (!asignatura || !asignatura.profesor || asignatura.profesor.length === 0) {
            return res.status(404).send('No hay profesores en esta asignatura.');
        }

        // Obtener los correos de los profesores
        const correosProfesores = asignatura.profesor.map(prof => prof.email);

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mario.marugan.profesor@gmail.com',
                pass: 'vxsz pfyf wuhv nufk' // No la normal, sino una generada en Google
            }
        });

        //  Enviar el correo a todos los profesores
        let info = await transporter.sendMail({
            from: 'camelmafiadam@outlook.es', // Debe coincidir con el remitente
            to: correosProfesores.join(','), // Lista de destinatarios
            subject: 'Mensaje desde la plataforma',
            text: mensaje
        });

        console.log('Correo enviado a:', correosProfesores);
        res.redirect('back');

    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).send('Error al enviar el mensaje.');
    }
});





module.exports = router;