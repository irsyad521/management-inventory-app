import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
    {
        nama_pemasok: {
            type: String,
            required: true,
            unique: true,
        },
        alamat: {
            type: String,
            required: true,
        },
        kontak: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
