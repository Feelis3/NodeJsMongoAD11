const mongoose = require('mongoose');

const { Schema } = mongoose;


//Atributos asignatura
const asignaturaSchema = new Schema({
    nombre:  { type: String, required: true },
    curso: { type: Schema.Types.ObjectId, ref:'cursos', required: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: "users" }], default: []
});



module.exports = mongoose.model('asignaturas', asignaturaSchema);
