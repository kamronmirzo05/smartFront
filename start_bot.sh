#!/bin/bash

# Telegram botni ishga tushirish scripti
cd "$(dirname "$0")"

# Virtual environmentni faollashtirish (agar mavjud bo'lsa)
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi

# Bot dependencieslarni tekshirish
echo "Bot dependencieslarni tekshirish..."
pip3 install python-telegram-bot requests > /dev/null 2>&1

# Botni ishga tushirish
echo ""
echo "=========================================="
echo "Telegram bot ishga tushmoqda..."
echo "=========================================="
echo ""
python3 bot.py
