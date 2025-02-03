const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const Asignaturas = require('./asignatura');


const { Schema } = mongoose;

/*

    0 = Normal
    1 = profesor
    2 = admin

*/

// Atributos usuarios
const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  age: { type: Number, required: true },
  role: { type: Number, required: true, default: 0 },
  asignaturas: [{ type: Schema.Types.ObjectId, ref: "asignaturas" }]
});

// Método para encriptar la contraseña
userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

// Método para comparar contraseñas
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Método para buscar un usuario por email
userSchema.methods.findEmail = async function (email) {
  const User = mongoose.model("user", userSchema);
  return await User.findOne({ 'email': email })
      .then(result => { return result })
      .catch(error => console.log(error));
};

// Método para insertar un usuario
userSchema.methods.insert = async function () {
  await this.save()
      .then(result => console.log(result))
      .catch(error => console.log(error));
};

// Método para eliminar un usuario
userSchema.methods.delete = async function (id) {
  const User = mongoose.model("user", userSchema);
  await User.deleteOne({ '_id': id })
      .then(result => console.log(result))
      .catch(error => console.log(error));
};

// Método para encontrar las asignaturas de un usuario por su ID
userSchema.methods.findAsignaturas = async function (id) {
  const User = mongoose.model("user", userSchema);
  return await User.findById(id)
      .populate("asignaturas", "nombre") // Solo obtener el campo "nombre" de las asignaturas
      .then(user => {
        if (user) {
          return user.asignaturas; // Retorna las asignaturas del usuario
        } else {
          throw new Error("Usuario no encontrado");
        }
      })
      .catch(error => {
        console.error("❌ Error al buscar las asignaturas:", error);
        throw error;
      });
};



module.exports = mongoose.model('users', userSchema);