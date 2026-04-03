#!/bin/bash

echo "PriceSlice Setup Script"
echo "========================"

# Setup Backend
echo ""
echo "Setting up Backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies"
    exit 1
fi
cd ..

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "========================"
echo "Setup complete!"
echo ""
echo "To start the application:"
echo "1. Configure your PostgreSQL database"
echo "2. Create .env file in backend folder (copy from .env.example)"
echo "3. Run: npm run dev"
echo ""
echo "For more information, see README.md"
