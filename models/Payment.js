// import mongoose from 'mongoose';

// const paymentSchema = new mongoose.Schema({
//     paymentId: { type: String, required: true, unique: true },
//     status: { type: String, required: true },
//     description: { type: String },
//     dateCreated: { type: Date, default: Date.now }
// });

// const PaymentModel = mongoose.model('Payment', paymentSchema);

// export default PaymentModel;

// src/models/Payment.js
import mongoose from 'mongoose';

// Defina o esquema de pagamento
const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Crie o modelo de pagamento
const PaymentModel = mongoose.model('Payment', paymentSchema);

export default PaymentModel;
