const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get reviews for a product
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        r.*,
        u.username
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get review summary (sentiment analysis)
const axios = require('axios');
const predictorUrl = process.env.PREDICTOR_URL || 'http://localhost:8001';

router.get('/summary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews,
        sentiment,
        COUNT(sentiment) as count
      FROM reviews 
      WHERE product_id = $1
      GROUP BY sentiment
    `;
    
    const reviewsQuery = `
      SELECT comment as text, rating
      FROM reviews
      WHERE product_id = $1
    `;
    
    const [detailResult, reviewsResult] = await Promise.all([
      pool.query(query, [id]),
      pool.query(reviewsQuery, [id])
    ]);

    const sentiments = {};
    detailResult.rows.forEach(row => {
      if (row.sentiment) {
        sentiments[row.sentiment] = Number(row.count);
      }
    });

    let summary_text = "Not enough reviews for AI summary.";
    try {
        if (reviewsResult.rows.length > 0) {
            const predictorResponse = await axios.post(`${predictorUrl}/reviews/summary`, {
                product_id: Number(id),
                reviews: reviewsResult.rows.map(r => ({ text: r.text || "", rating: Number(r.rating) }))
            }, { timeout: 10000 });
            if (predictorResponse.data && predictorResponse.data.summary_text) {
                summary_text = predictorResponse.data.summary_text;
            }
        }
    } catch (e) {
        console.error("Predictor review summary failed:", e.message);
    }
    
    const totalReviews = reviewsResult.rows.length;
    let avg = 0;
    if (totalReviews > 0) {
        avg = reviewsResult.rows.reduce((sum, r) => sum + Number(r.rating), 0) / totalReviews;
    }

    res.json({
      average_rating: avg,
      total_reviews: totalReviews,
      sentiment_breakdown: sentiments,
      summary_text: summary_text
    });
  } catch (error) {
    console.error('Error fetching review summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Add review
router.post('/', async (req, res) => {
  try {
    const { product_id, user_id, rating, comment, sentiment } = req.body;
    
    const query = `
      INSERT INTO reviews (product_id, user_id, rating, comment, sentiment) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [product_id, user_id, rating, comment, sentiment]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

module.exports = router;
