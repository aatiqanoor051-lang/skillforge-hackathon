#!/bin/bash

echo "Starting SkillForge Hackathon Setup..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed."
fi

# Install dependencies for services
echo "Installing Backend dependencies..."
cd backend && npm install && cd ..

echo "Installing Frontend dependencies..."
cd frontend && npm install && cd ..

echo "Setup complete!"
