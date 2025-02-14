const mongoose = require('mongoose');

const { Schema } = mongoose;

//Atributos asignatura
const softwareSchema = new Schema({
    direccion:  { type: String, required: true },
    descripcion: { type: String, required: true },
    asignatura: { type: Schema.Types.ObjectId, ref: 'softwares', required: true }
});

module.exports = mongoose.model('software', softwareSchema);