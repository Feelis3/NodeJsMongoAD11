const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const { Schema } = mongoose;

/*

    0 = Normal
    1 = profesor
    2 = admin

*/

const userSchema = new Schema({
  email:  { type: String, required: true },
  password:  { type: String, required: true },
  role: {type: Number, required: true, default: 0}
});

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

userSchema.methods.comparePassword= function (password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};
userSchema.methods.comparePassword= function (password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.findEmail= async (email) => {
  const User = mongoose.model("user", userSchema);
  return  await User.findOne({'email': email})
  .then(result => {return result})
  .catch(error => console.log(error));

};



//Insertar usuario
userSchema.methods.insert= async function () {
  //await this.save();
  await this.save()
  .then(result => console.log(result))
  .catch(error => console.log(error));
};

//Eliminar usuario
userSchema.methods.delete= async function (id) {
  const User = mongoose.model("user", userSchema);
  await User.deleteOne({'_id': id})
      .then(result => console.log(result))
      .catch(error => console.log(error));
}

module.exports = mongoose.model('user', userSchema);
