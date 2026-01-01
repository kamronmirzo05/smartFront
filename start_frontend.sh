#!/bin/bash

# Frontend serverni ishga tushirish scripti
cd "$(dirname "$0")"

# Dependencieslarni o'rnatish (agar kerak bo'lsa)
if [ ! -d "node_modules" ]; then
    echo "Dependencies o'rnatilmoqda..."
    npm install
fi

# Frontend serverni ishga tushirish
echo ""
echo "=========================================="
echo "Frontend server 3000 portda ishga tushmoqda..."
echo "=========================================="
echo ""
npm run dev
