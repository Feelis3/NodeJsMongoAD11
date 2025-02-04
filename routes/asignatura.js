const express = require('express');
const router = express.Router();
const Usuario = require('../models/user');


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
module.exports = router;