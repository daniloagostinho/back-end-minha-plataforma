import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    description: { type: String },
    dateCreated: { type: Date, default: Date.now }
});

const PaymentModel = mongoose.model('Payment', paymentSchema);

export default PaymentModel;
