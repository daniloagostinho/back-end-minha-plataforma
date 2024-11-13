const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
});

// Verifica se o modelo já foi criado antes de definir novamente
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
