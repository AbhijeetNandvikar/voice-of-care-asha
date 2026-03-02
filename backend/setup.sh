#!/bin/bash
# Setup script for Voice of Care backend

echo "Setting up Voice of Care backend..."

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

echo "Backend setup complete!"
echo "To activate the virtual environment, run: source venv/bin/activate"
echo "To start the development server, run: python -m app.main"
