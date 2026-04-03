from datetime import datetime, timezone
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="PriceSlice Predictor", version="1.0.0")


class HistoryPoint(BaseModel):
    price: float = Field(..., gt=0)
    recorded_at: datetime


class PredictRequest(BaseModel):
    product_id: int
    platform: str
    history: List[HistoryPoint]
    horizon_days: int = Field(7, ge=1, le=60)


class PredictResponse(BaseModel):
    product_id: int
    platform: str
    predicted_price: float
    confidence: float
    recommendation: str
    prediction_date: datetime


def _combined_forecast(prices: np.ndarray, horizon_days: int) -> float:
    if len(prices) == 1:
        return float(prices[-1])

    # 1. Linear Regression
    x = np.arange(len(prices), dtype=float)
    slope, intercept = np.polyfit(x, prices, 1)
    next_x = x[-1] + horizon_days / max(len(prices), 1)
    lr_predicted = slope * next_x + intercept

    # 2. Moving Average (using a window of up to the last 3 prices)
    window_size = min(3, len(prices))
    ma_predicted = np.mean(prices[-window_size:])

    # 3. Combine both predictions (average them)
    predicted = (lr_predicted + ma_predicted) / 2
    return float(max(0.01, predicted))


def _confidence(prices: np.ndarray, predicted: float) -> float:
    if len(prices) < 3:
        return 55.0

    x = np.arange(len(prices), dtype=float)
    slope, intercept = np.polyfit(x, prices, 1)
    fitted = slope * x + intercept
    ss_res = float(np.sum((prices - fitted) ** 2))
    ss_tot = float(np.sum((prices - np.mean(prices)) ** 2))
    if ss_tot == 0:
        return 60.0

    r2 = max(0.0, min(1.0, 1 - ss_res / ss_tot))
    return float(50 + r2 * 45)


def _recommendation(last_price: float, predicted: float) -> str:
    if last_price <= 0:
        return "monitor"

    delta = (predicted - last_price) / last_price
    if delta <= -0.03:
        return "wait"
    if delta >= 0.03:
        return "buy_now"
    return "monitor"


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    if not payload.history:
        raise HTTPException(status_code=400, detail="History is required")

    history_sorted = sorted(payload.history, key=lambda p: p.recorded_at)
    prices = np.array([point.price for point in history_sorted], dtype=float)
    predicted = _combined_forecast(prices, payload.horizon_days)
    confidence = _confidence(prices, predicted)
    recommendation = _recommendation(float(prices[-1]), predicted)

    return PredictResponse(
        product_id=payload.product_id,
        platform=payload.platform,
        predicted_price=round(predicted, 2),
        confidence=round(confidence, 2),
        recommendation=recommendation,
        prediction_date=datetime.now(timezone.utc)
    )

class Review(BaseModel):
    text: str
    rating: int = Field(..., ge=1, le=5)

class ReviewsSummaryRequest(BaseModel):
    product_id: int
    reviews: List[Review]

class ReviewsSummaryResponse(BaseModel):
    product_id: int
    average_rating: float
    sentiment: str
    summary_text: str

def _summarize_reviews(reviews: List[Review]) -> dict:
    if not reviews:
        return {"average_rating": 0.0, "sentiment": "neutral", "summary_text": "No reviews available."}
    
    avg = sum(r.rating for r in reviews) / len(reviews)
    if avg >= 4:
        sentiment = "positive"
        summary_text = "Users generally love this product, praising its quality and value."
    elif avg >= 2.5:
        sentiment = "neutral"
        summary_text = "Mixed reviews. Some users are satisfied, while others point out notable flaws."
    else:
        sentiment = "negative"
        summary_text = "Most users are dissatisfied with this product, highlighting significant issues."
        
    return {
        "average_rating": round(avg, 2),
        "sentiment": sentiment,
        "summary_text": summary_text
    }

@app.post("/reviews/summary", response_model=ReviewsSummaryResponse)
def summarize_reviews_endpoint(payload: ReviewsSummaryRequest):
    res = _summarize_reviews(payload.reviews)
    return ReviewsSummaryResponse(
        product_id=payload.product_id,
        average_rating=res["average_rating"],
        sentiment=res["sentiment"],
        summary_text=res["summary_text"]
    )
