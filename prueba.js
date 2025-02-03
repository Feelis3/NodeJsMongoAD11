const mongoose = require('mongoose');

// Cadena de conexión de MongoDB Atlas
const uri = "mongodb+srv://marcos090705:1234@nodejs.zdaw9.mongodb.net/AD";

// Conectar a la base de datos
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conexión a MongoDB Atlas establecida');
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB Atlas:', err);
  });

// Definir el esquema y el modelo
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Number, required: true, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Crear un nuevo usuario
const newUser = new User({
  email: "usuario@gmail.com",
  password: "123"
});

// Guardar el usuario en la base de datos
newUser.save()
  .then(user => {
    console.log('Usuario creado:', user);
  })
  .catch(err => {
    console.error('Error al crear el usuario:', err);
  });