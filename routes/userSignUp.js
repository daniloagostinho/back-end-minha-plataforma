import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = 'sua_chave_secreta_aqui'; // Substitua por uma chave secreta mais segura

// Rota para cadastro
router.post('/api/signup', async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar um novo usuário
    const newUser = new User({
      nome,
      email,
      senha: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// Rota para login
router.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }

    // Verificar a senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }

    // Gerar um token JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, user: { nome: user.nome, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

export default router;
