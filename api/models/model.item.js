import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
    {
        nama_barang: {
            type: String,
            required: true,
            unique: true,
        },
        deskripsi: {
            type: String,
            required: true,
        },
        harga: {
            type: Number,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
        },
        pemasok: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true,
        },
        gambar_barang: {
            type: String,
            default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
        },
    },
    { timestamps: true },
);

const Item = mongoose.model('Item', itemSchema);

export default Item;
