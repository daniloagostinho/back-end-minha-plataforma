const cors = require('cors');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport'); // Certifique-se de importar o passport
require('./config/passport'); // Importa o arquivo de configuração do passport

const app = express();
const User = require('./models/User'); // Caminho correto para o modelo

// Configuração do Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração do Express
app.use(cors({
    origin: 'http://localhost:3000', // Permitir o frontend acessar o backend
    credentials: true
}));

// Use apenas express-session
app.use(session({
    secret: '@88Ab15cd98Ef12', // Substitua por uma chave secreta segura
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Backend está funcionando!');
});

// Rotas de autenticação
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    // Redireciona para o frontend React na porta 3000
    res.redirect('http://localhost:3000/dashboard');
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Rota para obter o usuário logado
app.get('/api/current_user', (req, res) => {
    if (req.user) {
        res.json(req.user); // Retorne os dados do usuário como JSON
    } else {
        res.status(401).json({ error: "Usuário não autenticado" }); // Retorne um erro se não estiver autenticado
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
