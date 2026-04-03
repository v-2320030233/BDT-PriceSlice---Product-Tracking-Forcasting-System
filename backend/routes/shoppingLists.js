const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all shopping lists for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT sl.*, COUNT(sli.id) as item_count
      FROM shopping_lists sl
      LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
      WHERE sl.user_id = $1
      GROUP BY sl.id
      ORDER BY sl.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Get single shopping list with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const listQuery = 'SELECT * FROM shopping_lists WHERE id = $1';
    const itemsQuery = `
      SELECT sli.*, p.name, p.image_url, ph.price, ph.platform
      FROM shopping_list_items sli
      JOIN products p ON sli.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT DISTINCT ON (platform) price, platform
        FROM price_history 
        WHERE product_id = p.id 
        ORDER BY platform, recorded_at DESC
      ) ph ON true
      WHERE sli.list_id = $1
    `;
    
    const [listResult, itemsResult] = await Promise.all([
      pool.query(listQuery, [id]),
      pool.query(itemsQuery, [id])
    ]);

    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({
      list: listResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

// Create shopping list
router.post('/', async (req, res) => {
  try {
    const { user_id, name, budget } = req.body;
    
    const query = `
      INSERT INTO shopping_lists (user_id, name, budget) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [user_id, name, budget]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// Add item to list
router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity } = req.body;
    
    const query = `
      INSERT INTO shopping_list_items (list_id, product_id, quantity) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, product_id, quantity]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Calculate list total
router.get('/:id/total', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        SUM(ph.price * sli.quantity) as total_cost,
        COUNT(sli.id) as item_count,
        sl.budget,
        CASE 
          WHEN SUM(ph.price * sli.quantity) > sl.budget THEN 'over_budget'
          ELSE 'within_budget'
        END as status
      FROM shopping_list_items sli
      JOIN shopping_lists sl ON sli.list_id = sl.id
      LEFT JOIN LATERAL (
        SELECT DISTINCT ON (product_id) price
        FROM price_history 
        WHERE product_id = sli.product_id 
        ORDER BY product_id, recorded_at DESC
      ) ph ON sli.product_id = ph.product_id
      WHERE sli.list_id = $1
      GROUP BY sl.id
    `;
    
    const result = await pool.query(query, [id]);
    res.json(result.rows[0] || { total_cost: 0, item_count: 0 });
  } catch (error) {
    console.error('Error calculating total:', error);
    res.status(500).json({ error: 'Failed to calculate total' });
  }
});

module.exports = router;
