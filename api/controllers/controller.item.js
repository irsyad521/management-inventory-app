import Item from '../models/model.item.js';
import StockTransaction from '../models/model.stockTransaction.js';
import { errorHandler } from '../utils/error.js';
import Supplier from '../models/model.supplier.js';

export const addItem = async (req, res, next) => {
    const { nama_barang, deskripsi, harga, pemasok, gambar_barang } = req.body;

    if (!nama_barang || !deskripsi || !harga || !pemasok) {
        return next(errorHandler(400, 'Please provide all required fields'));
    }

    try {
        const existingSupplier = await Supplier.findById(pemasok);
        if (!existingSupplier) {
            return next(errorHandler(404, 'Supplier not found'));
        }

        const slug = nama_barang
            .split(' ')
            .join('-')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-]/g, '');

        const newItem = new Item({
            nama_barang,
            deskripsi,
            harga,
            slug,
            pemasok,
            gambar_barang,
        });

        const savedItem = await newItem.save();

        res.status(201).json(savedItem);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            return next(errorHandler(400, 'Duplicate item name'));
        }
        next(error);
    }
};

export const getItem = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const items = await Item.find({
            ...(req.query.slug && { slug: req.query.slug }),
            ...(req.query.searchTerm && {
                $or: [
                    { nama_barang: { $regex: req.query.searchTerm, $options: 'i' } },
                    { deskripsi: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        })
            .populate('pemasok')
            .sort({ updatedAt: sortDirection })
            .skip(startIndex)
            .limit(limit);

        const totalItems = await Item.countDocuments();
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const lastMonthItems = await Item.countDocuments({
            createdAt: { $gte: oneMonthAgo },
        });

        res.status(200).json({
            items,
            totalItems,
            lastMonthItems,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteItem = async (req, res, next) => {
    try {
        const deletedItem = await Item.findById(req.params.itemId);
        if (!deletedItem) {
            return next(errorHandler(404, 'Item not found'));
        }

        await StockTransaction.deleteMany({ id_barang: req.params.itemId });

        await Item.findByIdAndDelete(req.params.itemId);

        res.status(200).json({ message: 'Item and stock transactions deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateItem = async (req, res, next) => {
    const { nama_barang, deskripsi, harga, pemasok, gambar_barang } = req.body;

    if (!nama_barang || !deskripsi || !harga || !pemasok) {
        return next(errorHandler(400, 'Please provide all required fields'));
    }

    try {
        const slug = nama_barang
            .split(' ')
            .join('-')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-]/g, '');

        const existingSupplier = await Supplier.findById(pemasok);
        if (!existingSupplier) {
            return next(errorHandler(404, 'Supplier not found'));
        }

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.itemId,
            { nama_barang, deskripsi, harga, slug, pemasok, gambar_barang },
            { new: true },
        );

        if (!updatedItem) {
            return next(errorHandler(404, 'Item not found'));
        }
        res.status(200).json(updatedItem);
    } catch (error) {
        next(error);
    }
};
