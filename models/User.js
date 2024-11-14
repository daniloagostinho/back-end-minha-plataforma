import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
});

// Verifica se o modelo já foi criado antes de definir novamente
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; // Exportação padrão para permitir a importação correta
