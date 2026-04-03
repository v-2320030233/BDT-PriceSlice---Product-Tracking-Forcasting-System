# PriceSlice 📊

A comprehensive **Product Tracking, Analysis, and Price Prediction System** designed to help users track e-commerce product price histories, visualize trends, and ingest AI-powered insights to make informed buying decisions.

## 🎯 Project Overview

PriceSlice aggregates pricing data across multiple platforms (like Amazon and Flipkart), providing historical analytics and real-time AI summaries. The application is designed to simulate a professional trading dashboard, applied to consumer electronics.

### Key Features
- **Centralized Dashboard**: A rich, dark-themed user interface to track items and organize shopping lists.
- **Price Trend Visualization**: Interactive charts mapping historical price drops and spikes over time.
- **Machine Learning Predictor**: An AI service that recommends whether to "Buy Now", "Wait", or "Monitor" based on price trends.
- **Sentiment Analysis & Summarization**: Aggregates product reviews and produces concise summaries extracting key positive and negative aspects.
- **Developer Mock Mode**: Built-in mock data for fully functional local testing without needing a database connection out of the box.

---

## 🛠️ Tech Stack & Architecture

PriceSlice heavily relies on a microservice-style architecture separated into three distinct domains:

### 1. `frontend/` (The Client)
- **Framework**: React.js with Vite/CRA.
- **Styling**: Vanilla CSS / Tailwind CSS crafted for a high-contrast, premium dark mode aesthetic.
- **Role**: Handles UI state, API requests to the backend, and rendering interactive price charts.

### 2. `backend/` (The Core API Server)
- **Framework**: Node.js & Express.
- **Role**: Acts as the central hub. It serves mock/live product data, proxies AI requests to the Python predictor, handles CORS configuration, and manages user shopping lists.

### 3. `predictor/` (The AI/ML Engine)
- **Framework**: Python (FastAPI / Flask).
- **Role**: Contains the AI logic. Responsible for consuming arrays of review texts to generate summarized text, and creating models that forecast future product prices based on statistical data.

---

## 📂 Project Structure

```text
PriceSlice/
├── backend/          # Node.js REST API router
│   ├── routes/       # API route definitions
│   ├── server.js     # Express app initialization
│   └── package.json  
├── frontend/         # React SPA
│   ├── src/          # Components, pages, and styles
│   └── package.json  
├── predictor/        # Python ML service
│   ├── app.py        # Central intelligence server
│   └── (models)      # AI Models & NLP configs
└── README.md         # You are here!
```

---

## 🚀 Local Development Setup

To run the entire suite locally, you will need to open **three separate terminals**, one for each service.

### 1. Start the Node Backend
The backend provides all the data routes to the frontend.
```bash
cd backend
npm install
npm start
```
*(Runs on: `http://localhost:5000`)*

### 2. Start the AI Predictor Service
The python service must be running for sentiment analysis and price prediction features to work.
```bash
cd predictor
# Install your python environment and requirements
pip install -r requirements.txt
python app.py
```
*(Runs on: `http://localhost:8001` or as specified in your setup)*

### 3. Start the React Frontend
```bash
cd frontend
npm install
npm start
```
*(Runs on: `http://localhost:3000`)*

Open your browser to `http://localhost:3000` to interact with the PriceSlice dashboard!
