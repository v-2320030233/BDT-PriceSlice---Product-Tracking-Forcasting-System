const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM products ORDER BY updated_at DESC LIMIT 50';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID with price history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productQuery = 'SELECT * FROM products WHERE id = $1';
    const priceQuery = `
      SELECT * FROM price_history 
      WHERE product_id = $1 
      ORDER BY recorded_at DESC 
      LIMIT 100
    `;
    
    const [productResult, priceResult] = await Promise.all([
      pool.query(productQuery, [id]),
      pool.query(priceQuery, [id])
    ]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      product: productResult.rows[0],
      priceHistory: priceResult.rows
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Search products
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    const query = `
      SELECT * FROM products 
      WHERE name ILIKE $1 OR description ILIKE $1 
      ORDER BY name 
      LIMIT 20
    `;
    const result = await pool.query(query, [`%${q}%`]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, description, category, image_url } = req.body;
    const query = `
      INSERT INTO products (name, description, category, image_url) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, category, image_url]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router;
