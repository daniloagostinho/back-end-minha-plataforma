import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Rota para login
router.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // Verificar a senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // Gerar um token JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, user: { nome: user.nome, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

export default router;
