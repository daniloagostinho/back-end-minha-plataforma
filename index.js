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
import PaymentModel from './models/Payment.js';
import bcrypt from 'bcrypt';

import { v4 as uuid } from 'uuid';

import userRoutes from './routes/userRoutes.js';
import userSignUp from './routes/userSignUp.js';
import userLogin from './routes/userLogin.js';
import webhooks from './routes/webhooks.js'

dotenv.config();

const User = mongoose.models.User || mongoose.model('User', userSchema);


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
    origin: '*', // Permite qualquer origem
    credentials: true // Se precisar suportar cookies ou cabeçalhos de autenticação
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(userRoutes);
app.use(userSignUp);
app.use(userLogin);
app.use('/webhook', webhooks);

// Modelo do Usuário
const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true }
});


// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Backend está funcionando!');
});

// Rotas de autenticação
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('http://localhost:5000/dashboard');
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Rota para obter o usuário logado
// app.get('/api/current_user', (req, res) => {
//     if (req.user) {
//         res.json(req.user);
//     } else {
//         res.status(401).json({ error: "Usuário não autenticado" });
//     }
// });

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
            notification_url: 'https://back-end-minha-plataforma-app.vercel.app/webhook'
        };  


        const requestOptions = {
            idempotencyKey: uuidv4(),
        };

        // Criar pagamento com PIX
        const response = await payment.create({ body, requestOptions });
        res.status(200).json({ message: 'Pagamento criado com sucesso', response });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment-method', async (req, res) => {
    const { bin } = req.body; // Obtém o bin do corpo da requisição

    try {
        // Verifica se o bin foi enviado corretamente
        if (!bin || bin.length !== 6) {
            return res.status(400).json({ error: 'BIN inválido. Deve ter 6 dígitos.' });
        }

        // Faz a requisição para a API do Mercado Pago com o bin
        const response = await fetch(`https://api.mercadopago.com/v1/payment_methods?bin=${bin}`, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`, // Access token do Mercado Pago
            },
        });

        const data = await response.json();

        if (data && data.length > 0) {
            // Se encontrar o método de pagamento, retorna o payment_method_id
            res.status(200).json({ paymentMethodId: data[0].id });
        } else {
            // Se não encontrar, retorna um erro 404
            res.status(404).json({ error: 'Método de pagamento não encontrado' });
        }
    } catch (error) {
        // Trata erros de requisição ou do servidor
        console.error('Erro ao obter o método de pagamento:', error);
        res.status(500).json({ error: 'Erro ao obter o método de pagamento' });
    }
});

// Rota para criar um pagamento com Cartão de Crédito
app.post('/api/pagamento/cartao', async (req, res) => {
    try {
        const { transaction_amount, token, description, installments, payment_method_id, email } = req.body;

        // Validação simples de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        // Objeto de pagamento com cartão de crédito
        const body = {
            transaction_amount: parseFloat(transaction_amount),
            token: token,
            description: description,
            installments: parseInt(installments),
            payment_method_id: payment_method_id,
            payer: { email: email },
        };

        const requestOptions = {
            idempotencyKey: uuidv4(),
        };

        // Criar pagamento com Cartão de Crédito
        const response = await payment.create({ body, requestOptions });

        // Verifique o status da transação
        if (response && response.body) {
            const { status, status_detail } = response.body;

            if (status === 'approved') {
                res.status(200).json({ message: 'Pagamento aprovado', response });
            } else {
                // Retorne detalhes do motivo da rejeição
                res.status(400).json({
                    message: 'Pagamento não aprovado',
                    status,
                    status_detail,
                    response,
                });
            }
        } else {
            res.status(500).json({ error: 'Resposta inesperada da API de pagamento', response });
        }
    } catch (error) {
        console.error('Erro ao processar pagamento com cartão de crédito:', error);
        res.status(500).json({ error: error.message });
    }
});


// Função para gerar o token do cartão
async function generateCardToken({ cardNumber, cardName, expiryDate, cvv }) {
    try {
        // Divida a data de validade em mês e ano
        const [month, year] = expiryDate.split('/');

        // Corrige o ano para o formato de quatro dígitos
        const formattedYear = year.length === 2 ? `20${year}` : year;

        // Crie o corpo da requisição para o Mercado Pago
        const requestBody = {
            card_number: cardNumber,
            cardholder: {
                name: cardName
            },
            expiration_month: parseInt(month.trim()),
            expiration_year: parseInt(formattedYear.trim()),
            security_code: cvv,
        };

        // Faça a requisição para a API do Mercado Pago
        const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`, // Access token do Mercado Pago
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data && data.id) {
            return data.id; // Retorne o token gerado
        } else {
            throw new Error('Falha ao gerar token do cartão: ' + (data.message || 'Erro desconhecido.'));
        }
    } catch (error) {
        console.error('Erro ao gerar token do cartão:', error);
        throw error;
    }
}

// Endpoint para gerar o token do cartão
app.post('/api/gerar-token-cartao', async (req, res) => {
    try {
        const { cardNumber, cardName, expiryDate, cvv } = req.body;

        // Validação básica dos dados do cartão (opcional)
        if (!cardNumber || !cardName || !expiryDate || !cvv) {
            return res.status(400).json({ error: 'Todos os campos do cartão são obrigatórios.' });
        }

        // Gere o token do cartão
        const token = await generateCardToken({ cardNumber, cardName, expiryDate, cvv });

        // Retorne o token para o front-end
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
