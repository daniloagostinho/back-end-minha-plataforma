// No seu arquivo de backend, adicione esta rota para buscar informações do usuário
import express from 'express';
import User from '../models/User.js'; // Importe o modelo de usuário

const router = express.Router();

// Rota para buscar informações do usuário
router.get('/', async (req, res) => {
    console.log("GET webhook");
    console.log(req.body);
    res.send("GET WEBHOOK OK")
});

router.post('/', async (req, res) => {
    console.log("POST webhook");
    console.log(req.body);
    res.send("POST WEBHOOK OK")
});

export default router;
