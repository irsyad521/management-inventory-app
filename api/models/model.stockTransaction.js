import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
    {
        id_barang: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true,
        },
        jumlah: {
            type: Number,
            required: true,
        },
        jenis: {
            type: String,
            enum: ['masuk', 'keluar'],
            required: true,
        },
        tanggal: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true },
);

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

export default StockTransaction;
