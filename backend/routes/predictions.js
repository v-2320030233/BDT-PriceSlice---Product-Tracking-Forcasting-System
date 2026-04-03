const express = require('express');
const axios = require('axios');
const pool = require('../config/database');
const router = express.Router();

const predictorUrl = process.env.PREDICTOR_URL || 'http://localhost:8001';
const predictionFreshHours = Number(process.env.PREDICTION_FRESH_HOURS || '24');
const predictionHorizonDays = Number(process.env.PREDICTION_HORIZON_DAYS || '7');

const groupByPlatform = (rows) => {
  return rows.reduce((acc, row) => {
    if (!acc[row.platform]) {
      acc[row.platform] = [];
    }
    acc[row.platform].push({
      price: Number(row.price),
      recorded_at: row.recorded_at
    });
    return acc;
  }, {});
};

const fetchPriceHistory = async (productId) => {
  const query = `
    SELECT platform, price, recorded_at
    FROM price_history
    WHERE product_id = $1
      AND recorded_at >= NOW() - INTERVAL '90 days'
    ORDER BY recorded_at ASC
  `;
  const result = await pool.query(query, [productId]);
  return result.rows || [];
};

const insertPrediction = async (prediction) => {
  const query = `
    INSERT INTO price_predictions
      (product_id, platform, predicted_price, confidence, recommendation, prediction_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await pool.query(query, [
    prediction.product_id,
    prediction.platform,
    prediction.predicted_price,
    prediction.confidence,
    prediction.recommendation,
    prediction.prediction_date
  ]);

  return result.rows[0];
};

const generatePredictionsForProduct = async (productId) => {
  const historyRows = await fetchPriceHistory(productId);
  if (historyRows.length === 0) {
    return [];
  }

  const byPlatform = groupByPlatform(historyRows);
  const platformEntries = Object.entries(byPlatform);
  const predictions = [];

  for (const [platform, history] of platformEntries) {
    if (history.length === 0) continue;

    const response = await axios.post(
      `${predictorUrl}/predict`,
      {
        product_id: Number(productId),
        platform,
        history,
        horizon_days: predictionHorizonDays
      },
      { timeout: 10000 }
    );

    const saved = await insertPrediction({
      ...response.data,
      product_id: Number(productId),
      platform
    });

    predictions.push(saved);
  }

  return predictions;
};

// Get price predictions for a product (auto-generate when stale or missing)
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const freshQuery = `
      SELECT *
      FROM price_predictions
      WHERE product_id = $1
        AND COALESCE(prediction_date, created_at) >= NOW() - ($2 * INTERVAL '1 hour')
      ORDER BY COALESCE(prediction_date, created_at) DESC
      LIMIT 10
    `;

    const freshResult = await pool.query(freshQuery, [id, predictionFreshHours]);
    if (freshResult.rows.length > 0) {
      return res.json(freshResult.rows);
    }

    const generated = await generatePredictionsForProduct(id);
    return res.json(generated);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Create price prediction manually
router.post('/', async (req, res) => {
  try {
    const { product_id, platform, predicted_price, confidence, recommendation, prediction_date } = req.body;

    const query = `
      INSERT INTO price_predictions
        (product_id, platform, predicted_price, confidence, recommendation, prediction_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      product_id,
      platform,
      predicted_price,
      confidence,
      recommendation,
      prediction_date || new Date().toISOString()
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

// Force-generate predictions for a product
router.post('/generate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const generated = await generatePredictionsForProduct(id);
    res.json(generated);
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

module.exports = router;
