const mongoose = require('mongoose');

const { Schema } = mongoose;

//Atributos asignatura
const subjectSchema = new Schema({

    name: { type: String, required: true },
    description: { type: String, required: true },
});

//Insertar asignatura
subjectSchema.methods.insert= async function () {
    //await this.save();
    await this.save()
        .then(result => console.log(result))
        .catch(error => console.log(error));
};

//Eliminar asignatura
subjectSchema.methods.delete= async function (id) {
    const Subject = mongoose.model("subject", subjectSchema);
    await Subject.deleteOne({'_id': id})
        .then(result => console.log(result))
        .catch(error => console.log(error));
}

module.exports = mongoose.model('subject', subjectSchema);
