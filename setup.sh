#!/bin/bash

# Shopify Products MongoDB Integration Setup Script

echo "🛍️  Setting up Shopify Products MongoDB Integration..."

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB first."
    echo "   Download from: https://www.mongodb.com/try/download/community"
    echo "   Or install via:"
    echo "   - Windows: Download .msi from MongoDB website"
    echo "   - macOS: brew install mongodb-community"
    echo "   - Linux: sudo apt install mongodb (Ubuntu/Debian)"
    exit 1
fi

echo "✅ MongoDB found"

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Check environment configuration
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating default configuration..."
    cat > .env << EOL
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/shopify-all-products

# Shopify Configuration (Replace with your actual values)
SHOPIFY_API_KEY=your_actual_api_key_here
SHOPIFY_API_SECRET=your_actual_api_secret_here
SCOPES=read_products,read_product_listings

# Optional: Custom shop domain (for private apps)
# SHOP_CUSTOM_DOMAIN=your-store.myshopify.com
EOL
    echo "✅ Default .env file created. Please update with your Shopify credentials."
else
    echo "✅ .env file found"
fi

# Start MongoDB (Linux/macOS)
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🚀 Starting MongoDB..."
    
    # Try to start MongoDB service
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod 2>/dev/null || sudo systemctl start mongodb 2>/dev/null
    elif command -v brew &> /dev/null; then
        brew services start mongodb/brew/mongodb-community 2>/dev/null
    fi
    
    # Create data directory if it doesn't exist
    mkdir -p /tmp/mongodb-data
    
    # Start MongoDB in background if not running
    if ! pgrep -x "mongod" > /dev/null; then
        mongod --dbpath /tmp/mongodb-data --fork --logpath /tmp/mongodb.log
        echo "✅ MongoDB started in background"
    else
        echo "✅ MongoDB is already running"
    fi
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Update your Shopify credentials in .env file"
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Install the app in your Shopify store:"
echo "   - Go to Shopify Partners dashboard"
echo "   - Install the app on your test store"
echo ""
echo "4. Open the app and sync products:"
echo "   - Navigate to Products section"
echo "   - Click 'Sync from Shopify' to fetch products"
echo ""
echo "📖 See README.md for detailed instructions"
echo ""
echo "🔗 Useful links:"
echo "   - MongoDB Compass: mongodb://localhost:27017/shopify-all-products"
echo "   - Dev server: http://localhost:3000"
echo ""