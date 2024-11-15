// Importações
import express from 'express';
import User from '../models/User.js'; // Importe o modelo de usuário, se necessário
import PaymentModel from '../models/Payment.js'; // Importe o modelo de pagamento, se necessário

const router = express.Router();

// Middleware para processar requisições JSON
router.use(express.json());

// Rota para lidar com notificações do Mercado Pago
router.post('/', async (req, res) => {
    console.log("POST webhook");

    try {
        const { body } = req;
        console.log("Corpo da notificação recebido:", body);

        // Verifique se a notificação tem o ID de pagamento
        if (body && body.data && body.data.id) {
            const paymentId = body.data.id;

            // Aqui você pode fazer uma requisição para a API do Mercado Pago
            // para obter mais detalhes sobre o pagamento, se necessário

            // Exemplo de como você poderia salvar ou atualizar o status do pagamento no banco de dados
            const payment = await PaymentModel.findOneAndUpdate(
                { paymentId },
                { status: body.action }, // Atualize o status conforme a notificação
                { upsert: true, new: true }
            );

            console.log("Status do pagamento atualizado:", payment);

            res.status(200).send("Webhook processado com sucesso");
        } else {
            res.status(400).send("Dados inválidos na notificação");
        }
    } catch (error) {
        console.error("Erro ao processar o webhook:", error);
        res.status(500).send("Erro ao processar o webhook");
    }
});

// Rota para buscar o status do pagamento
router.get('/status/:paymentId', async (req, res) => {
    const { paymentId } = req.params;

    try {
        // Faça uma requisição à API do Mercado Pago para obter o status do pagamento
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`, // Use seu token de acesso do Mercado Pago
            },
        });

        const data = await response.json();

        if (response.ok) {
            // Retorne o status do pagamento
            res.status(200).json({ status: data.status, detail: data.status_detail });
        } else {
            // Se a requisição falhou, retorne o erro
            res.status(400).json({ error: data.message || 'Erro ao buscar status do pagamento.' });
        }
    } catch (error) {
        console.error('Erro ao buscar status do pagamento:', error);
        res.status(500).json({ error: 'Erro ao buscar status do pagamento.' });
    }
});

export default router;
