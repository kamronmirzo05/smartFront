#!/bin/bash

# Backend serverini ishga tushirish scripti
cd "$(dirname "$0")/backend"

# Virtual environmentni faollashtirish (agar mavjud bo'lsa)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Superuser va superadmin yaratish
echo "Superuser va superadmin yaratilmoqda..."
python3 create_superusers.py

# Migrationslarni tekshirish
echo "Migrationslarni tekshirish..."
python3 manage.py makemigrations --no-input
python3 manage.py migrate --no-input

# Backend serverni ishga tushirish
echo ""
echo "=========================================="
echo "Backend server 8000 portda ishga tushmoqda..."
echo "=========================================="
echo ""
python3 manage.py runserver 8000
