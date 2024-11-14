// No seu arquivo de backend, adicione esta rota para buscar informações do usuário
import express from 'express';
import User from '../models/User.js'; // Importe o modelo de usuário

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
};

// Rota para buscar informações do usuário
router.get('/api/user', ensureAuthenticated, async (req, res) => {

  console.log("req -->> ", req.user)
  try {
    // Supondo que você tenha uma forma de autenticar o usuário e recuperar o ID
    const userId = req.user?.id; // Isso depende de como você está gerenciando a autenticação

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Encontre o usuário no banco de dados pelo ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Retorne as informações do usuário, excluindo a senha
    res.json({
      nome: user.nome,
      email: user.email,
      enrolledCourses: user.enrolledCourses, // Ajuste conforme sua estrutura de dados
    });
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
  }
});

export default router;
