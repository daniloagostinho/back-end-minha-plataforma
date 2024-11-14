import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import './config/passport.js';
import { MercadoPagoConfig, Payment, PaymentMethod, CardToken, Preference } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import User from './models/User.js';
import PaymentModel from './models/Payment.js';

import { v4 as uuid } from 'uuid';

dotenv.config();

const app = express();

// Configuração do cliente Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    options: { timeout: 5000, idempotencyKey: uuidv4() }
});

// Inicializando os objetos da API do Mercado Pago
const payment = new Payment(client);
const paymentMethod = new PaymentMethod(client);
const cardToken = new CardToken(client);
const preference = new Preference(client);

// Configuração do Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração do Express
app.use(cors({
    origin: 'https://back-end-minha-plataforma-app.vercel.app',
    credentials: true
}));

app.use(session({
    secret: '@88Ab15cd98Ef12',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Backend está funcionando!');
});

// Rotas de autenticação
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('https://back-end-minha-plataforma-app.vercel.app/dashboard');
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Rota para obter o usuário logado
app.get('/api/current_user', (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: "Usuário não autenticado" });
    }
});

// Rota para criar um pagamento com PIX
app.post('/api/pagamento/pix', async (req, res) => {
    try {
        const { valor, email, descricao } = req.body;

        // Validação simples de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        // Objeto de pagamento
        const body = {
            transaction_amount: parseFloat(valor),
            description: descricao,
            payment_method_id: 'pix',
            payer: { email: email },
            notification_url: 'https://back-end-minha-plataforma-app.vercel.app/v1/webhook'
        };


        const requestOptions  =  { 
            idempotencyKey : uuidv4() , 
        } ;

        // Criar pagamento com PIX
        const response = await payment.create({ body,  requestOptions});
        res.status(200).json({ message: 'Pagamento criado com sucesso', response });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook para receber notificações do Mercado Pago
app.get('/v1/webhook', async (req, res) => {
    console.log("body webhook __>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.body);
    res.send("POST OK");
});

// Rota para verificar o status do pagamento
// app.get('/api/pagamento/status/:id', async (req, res) => {
//     try {
//         const paymentId = req.params.id;

//         if (!paymentId || paymentId === 'null' || paymentId === 'undefined') {
//             return res.status(400).json({ error: 'ID de pagamento inválido ou não fornecido' });
//         }

//         const paymentDetails = await payment.get(paymentId);

//         if (paymentDetails && paymentDetails.body && paymentDetails.body.status) {
//             res.status(200).json({ status: paymentDetails.body.status });
//         } else {
//             res.status(404).json({ error: 'Pagamento não encontrado' });
//         }
//     } catch (error) {
//         console.error('Erro ao verificar o status do pagamento:', error);
//         res.status(500).json({ error: 'Erro ao verificar o status do pagamento' });
//     }
// });

// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
