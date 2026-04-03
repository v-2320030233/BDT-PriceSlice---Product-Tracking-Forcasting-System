const express = require('express');
const axios = require('axios');
const pool = require('../config/database');
const router = express.Router();

const parsePrice = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const mapSerpApiResults = (data) => {
  const results = data?.shopping_results || data?.inline_shopping_results || [];
  return results
    .map((item) => ({
      title: item.title || item.product_title || item.name || '',
      image_url: item.thumbnail || item.image || item.product_image || '',
      platform: item.source || item.merchant || item.seller || 'Unknown',
      price: parsePrice(item.extracted_price || item.price),
      url: item.link || item.product_link || '',
      in_stock: item.in_stock !== false,
      rating: Number(item.rating) || 0,
      reviews_count: Number(item.reviews) || 0,
      recorded_at: new Date().toISOString()
    }))
    .filter((item) => item.price !== null);
};

// Get price history for a product
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const query = `
      SELECT * FROM price_history 
      WHERE product_id = $1 
      AND recorded_at >= NOW() - INTERVAL '${parseInt(days)} days'
      ORDER BY recorded_at ASC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Get live prices from SerpAPI (Google Shopping)
router.get('/live/:id', async (req, res) => {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    const query = req.query.q || req.query.query;

    if (!apiKey) {
      return res.status(400).json({ error: 'SERPAPI_KEY not configured' });
    }
    if (!query || String(query).trim().length < 2) {
      return res.status(400).json({ error: 'Missing or invalid query' });
    }

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: apiKey,
        hl: 'en',
        gl: 'in'
      },
      timeout: 10000
    });

    const mapped = mapSerpApiResults(response.data);

    // FETCH AI REVIEW SUMMARIES FOR TOP 3 RESULTS USING PREDICTOR
    const predictorUrl = process.env.PREDICTOR_URL || 'http://127.0.0.1:8001';
    for (let i = 0; i < Math.min(mapped.length, 3); i++) {
        let product = mapped[i];
        if (product.rating > 0 && product.reviews_count > 0) {
            try {
                let dummyReviews = [];
                for(let j=0; j<Math.min(product.reviews_count, 5); j++) {
                    dummyReviews.push({ text: `Placeholder review for rating ${product.rating}`, rating: Math.round(product.rating) });
                }
                const predictorResponse = await axios.post(`${predictorUrl}/reviews/summary`, {
                    product_id: i + 1,
                    reviews: dummyReviews
                }, { timeout: 3000 });
                if (predictorResponse.data && predictorResponse.data.summary_text) {
                    product.ai_summary = predictorResponse.data.summary_text;
                }
            } catch(e) { 
                console.error("Predictor failed for live search:", e.message); 
                product.ai_summary = "Predictor error: " + e.message;
            }
        }
    }

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching live prices:', error?.response?.data || error);
    res.status(500).json({ error: 'Failed to fetch live prices', details: error?.response?.data || error.message });
  }
});

// Get best price across platforms
router.get('/best/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT DISTINCT ON (platform) 
        platform, price, url, in_stock, recorded_at 
      FROM price_history 
      WHERE product_id = $1 
      ORDER BY platform, recorded_at DESC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching best prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Add price record
router.post('/', async (req, res) => {
  try {
    const { product_id, platform, price, url, in_stock } = req.body;

    const query = `
      INSERT INTO price_history (product_id, platform, price, url, in_stock) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const result = await pool.query(query, [product_id, platform, price, url, in_stock]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding price:', error);
    res.status(500).json({ error: 'Failed to add price' });
  }
});

// Get price trends for a product
router.get('/trends/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        DATE(recorded_at) as date,
        platform,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(*) as records
      FROM price_history 
      WHERE product_id = $1 
      AND recorded_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(recorded_at), platform
      ORDER BY date, platform
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

module.exports = router;
