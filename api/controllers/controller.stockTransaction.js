import StockTransaction from '../models/model.stockTransaction.js';
import Item from '../models/model.item.js';
import { errorHandler } from '../utils/error.js';
import { isValidDate } from '../utils/validate.js';

export const addStockTransaction = async (req, res, next) => {
    const { id_barang, jumlah, tanggal, jenis } = req.body;

    try {
        if (!isValidDate(tanggal)) {
            return next(errorHandler(400, 'Invalid transaction date'));
        }

        if (jenis !== 'masuk' && jenis !== 'keluar') {
            return next(errorHandler(400, 'Invalid transaction type'));
        }

        if (parseInt(jumlah) <= 0) {
            return next(errorHandler(400, 'Transaction quantity must be a positive integer'));
        }

        const existingItem = await Item.findById(id_barang);
        if (!existingItem) {
            return next(errorHandler(404, 'Item not found'));
        }

        if (jenis === 'keluar' && existingItem.stock < jumlah) {
            return next(errorHandler(400, 'Requested quantity exceeds available stock'));
        }

        if (jenis === 'masuk') {
            existingItem.stock += jumlah;
        } else {
            existingItem.stock -= jumlah;
        }

        await existingItem.save();

        const newStockTransaction = new StockTransaction({
            id_barang,
            jumlah,
            tanggal,
            jenis,
        });

        const savedStockTransaction = await newStockTransaction.save();

        res.status(201).json(savedStockTransaction);
    } catch (error) {
        next(error);
    }
};

export const getStockTransactions = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 50;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const stockTransactions = await StockTransaction.find({
            ...(req.query.jenis && { jenis: req.query.jenis }),
            ...(req.query.id_barang && { id_barang: req.query.id_barang }),
            ...(req.query.searchTerm && {
                jenis: { $regex: req.query.searchTerm, $options: 'i' },
                id_barang: { $regex: req.query.searchTerm, $options: 'i' },
            }),
        })
            .sort({ tanggal: sortDirection })
            .skip(startIndex)
            .limit(limit);

        const totalStockTransactions = await StockTransaction.countDocuments();

        res.status(200).json({
            stockTransactions,
            totalStockTransactions,
        });
    } catch (error) {
        next(error);
    }
};

export const getStockTransactionsByMonth = async (req, res, next) => {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const id_barang = req.query.id_barang;

        const startDate = new Date(year, month - 1);
        const endDate = new Date(year, month);

        const additionalFilters = {};
        if (id_barang) {
            additionalFilters.id_barang = id_barang;
        }

        const stockTransactions = await StockTransaction.find({
            tanggal: { $gte: startDate, $lte: endDate },
            ...additionalFilters,
        });

        let totalStockIn = 0;
        let totalStockOut = 0;
        stockTransactions.forEach((transaction) => {
            if (transaction.jenis === 'masuk') {
                totalStockIn += transaction.jumlah;
            } else if (transaction.jenis === 'keluar') {
                totalStockOut += transaction.jumlah;
            }
        });

        const endingStock = totalStockIn - totalStockOut;

        const response = {
            month: month,
            year: year,
            totalStockIn: totalStockIn,
            totalStockOut: totalStockOut,
            endingStock: endingStock,
            stockTransactions: stockTransactions,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getStockTransactionsByYearAndItemId = async (req, res, next) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const id_barang = req.query.id_barang;

        const startDate = new Date(year, 0);
        const endDate = new Date(year + 1, 0);

        const additionalFilters = {};
        if (id_barang) {
            additionalFilters.id_barang = id_barang;
        }

        const stockTransactions = await StockTransaction.find({
            tanggal: { $gte: startDate, $lt: endDate },
            ...additionalFilters,
        });

        let totalStockIn = 0;
        let totalStockOut = 0;
        stockTransactions.forEach((transaction) => {
            if (transaction.jenis === 'masuk') {
                totalStockIn += transaction.jumlah;
            } else if (transaction.jenis === 'keluar') {
                totalStockOut += transaction.jumlah;
            }
        });

        const endingStock = totalStockIn - totalStockOut;

        const response = {
            year: year,
            totalStockIn: totalStockIn,
            totalStockOut: totalStockOut,
            endingStock: endingStock,
            stockTransactions: stockTransactions,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};
