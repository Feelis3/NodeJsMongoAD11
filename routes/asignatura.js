const express = require('express');
const router = express.Router();
const Usuario = require('../models/user');


router.get('/asignaturas', async (req, res) => {
    const user = new Usuario();
    const tasks = await user.findAsignaturas('67a13e07b29d7fed752428a9');
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
module.exports = router;