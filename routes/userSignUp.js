import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Importe o jsonwebtoken
import User from '../models/User.js';

const router = express.Router();

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

    // Gerar o token JWT
    const jwtToken = jwt.sign(
      { id: newUser._id }, // Payload com o ID do usuário
      process.env.JWT_SECRET, // Chave secreta para assinar o token (defina isso no seu arquivo .env)
      { expiresIn: '1h' } // O token expira em 1 hora
    );

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      token: jwtToken, // Retorna o token gerado
    });

  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

export default router;
