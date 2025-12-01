const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET all products with filtering
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { category, sub_category, search } = req.query;
        let queryText = 'SELECT * FROM products WHERE active = true';
        const queryParams = [];
        let paramCount = 1;

        if (category) {
            queryText += ` AND category = $${paramCount}`;
            queryParams.push(category);
            paramCount++;
        }

        if (sub_category) {
            queryText += ` AND sub_category = $${paramCount}`;
            queryParams.push(sub_category);
            paramCount++;
        }

        if (search) {
            queryText += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        queryText += ' ORDER BY name ASC';

        const result = await db.query(queryText, queryParams);
        res.json({ products: result.rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET single product by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST create new product (Admin only ideally, but open for now)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, sku, category, sub_category, image_url, description, price } = req.body;

        // Check if SKU exists
        const existing = await db.query('SELECT id FROM products WHERE sku = $1', [sku]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Product with this SKU already exists' });
        }

        const result = await db.query(
            `INSERT INTO products (name, sku, category, sub_category, image_url, description, price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
            [name, sku, category, sub_category, image_url, description, price]
        );

        res.status(201).json({ message: 'Product created', product: result.rows[0] });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

module.exports = router;
