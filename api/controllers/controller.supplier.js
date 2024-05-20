import Supplier from '../models/model.supplier.js';
import { errorHandler } from '../utils/error.js';

export const addSuplier = async (req, res, next) => {
    const { nama_pemasok, alamat, kontak } = req.body;

    if (!nama_pemasok || !alamat || !kontak || nama_pemasok === ' ' || alamat === ' ' || kontak === ' ') {
        return next(errorHandler(403, 'Please provide all required fields for supplier'));
    }

    try {
        const slug = nama_pemasok
            .split(' ')
            .join('-')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-]/g, '');

        const newSupplier = new Supplier({
            nama_pemasok: nama_pemasok,
            alamat: alamat,
            kontak: kontak,
            slug: slug,
        });
        const savedSupplier = await newSupplier.save();

        res.status(201).json(savedSupplier);
    } catch (error) {
        next(error);
    }
};

export const getSupplier = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const suppliers = await Supplier.find({
            ...(req.query.slug && { slug: req.query.slug }),
            ...(req.query.searchTerm && {
                $or: [
                    { nama_pemasok: { $regex: req.query.searchTerm, $options: 'i' } },
                    { alamat: { $regex: req.query.searchTerm, $options: 'i' } },
                    { kontak: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        })
            .sort({ updatedAt: sortDirection })
            .skip(startIndex)
            .limit(limit);

        const totalSuppliers = await Supplier.countDocuments();
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const lastMonthSuppliers = await Supplier.countDocuments({
            createdAt: { $gte: oneMonthAgo },
        });

        res.status(200).json({
            suppliers,
            totalSuppliers,
            lastMonthSuppliers,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSupplier = async (req, res, next) => {
    try {
        const deletedSupplier = await Supplier.findByIdAndDelete(req.params.supplierId);
        if (!deletedSupplier) {
            return next(errorHandler(404, 'Supplier not found'));
        }
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateSupplier = async (req, res, next) => {
    const { nama_pemasok, alamat, kontak } = req.body;

    if (!nama_pemasok || !alamat || !kontak || nama_pemasok === ' ' || alamat === ' ' || kontak === ' ') {
        return next(errorHandler(403, 'Please provide all required fields for supplier'));
    }

    try {
        const slug = nama_pemasok
            .split(' ')
            .join('-')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-]/g, '');

        const updatedSupplier = await Supplier.findByIdAndUpdate(
            req.params.supplierId,
            { nama_pemasok: nama_pemasok, alamat: alamat, kontak: kontak, slug: slug },
            { new: true },
        );

        if (!updatedSupplier) {
            return next(errorHandler(404, 'Supplier not found'));
        }
        res.status(200).json(updatedSupplier);
    } catch (error) {
        next(error);
    }
};
