import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-senha'); // Não retornar a senha
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
  }
});

export default router;
