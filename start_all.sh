#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}🚀 Smart City Platform - Barcha servislar${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
for cmd in python3 node npm; do
    if ! command_exists $cmd; then
        echo -e "${RED}❌ Xatolik: $cmd o'rnatilmagan${NC}"
        exit 1
    fi
done

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start Backend
echo -e "${YELLOW}🔧 Backend sozlanmoqda...${NC}"
cd backend

# Set up Python virtual environment
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Python virtual muhit yaratilmoqda...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo -e "${YELLOW}📦 Python paketlari o'rnatilmoqda...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
echo -e "${YELLOW}🔄 Ma'lumotlar bazasi yangilanmoqda...${NC}"
python manage.py migrate

# Create superuser and superadmin
echo -e "${YELLOW}👤 Admin foydalanuvchilar yaratilmoqda...${NC}"
# Check if setup_admin command exists, if not use create_superusers.py
if python manage.py help | grep -q setup_admin; then
    python manage.py setup_admin
else
    python create_superusers.py
fi

# Start Django development server
echo -e "${GREEN}🚀 Backend server ishga tushirilmoqda (8000-port)...${NC}"
python manage.py runserver 8000 > django.log 2>&1 &
BACKEND_PID=$!
echo -e "✅ Backend ishga tushdi (PID: $BACKEND_PID)"
sleep 3

# Go back to project root
cd "$SCRIPT_DIR"

# Start Frontend
echo -e "${YELLOW}📦 Frontend uchun kerakli paketlar o'rnatilmoqda...${NC}"
npm install

echo -e "${GREEN}🚀 Frontend server ishga tushirilmoqda (3000-port)...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "✅ Frontend ishga tushdi (PID: $FRONTEND_PID)"
sleep 3

# Start Telegram bot
echo -e "${GREEN}🤖 Telegram bot ishga tushirilmoqda...${NC}"
cd backend
source venv/bin/activate
python -m smartcity_app.bot > bot.log 2>&1 &
BOT_PID=$!
echo -e "✅ Bot ishga tushdi (PID: $BOT_PID)"
cd "$SCRIPT_DIR"

# Function to handle script termination
cleanup() {
    echo -e "\n${YELLOW}🛑 Barcha servislar to'xtatilmoqda...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $BOT_PID 2>/dev/null
    deactivate 2>/dev/null
    echo -e "${GREEN}✅ Barcha servislar to'xtatildi${NC}"
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ Barcha servislar muvaffaqiyatli ishga tushirildi!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "🌐 Frontend:    http://localhost:3000"
echo -e "📡 Backend:     http://localhost:8000"
echo -e "🔧 Admin Panel: http://localhost:8000/admin"
echo -e "\n🔐 Kirish ma'lumotlari:"
echo -e "   - Django Admin: admin / 123"
echo -e "   - Superadmin:   superadmin / 123"
echo -e "\n📝 Log fayllari:"
echo -e "   - Backend:  $SCRIPT_DIR/backend/django.log"
echo -e "   - Frontend: $SCRIPT_DIR/frontend.log"
echo -e "   - Bot:      $SCRIPT_DIR/backend/bot.log"
echo -e "\n🛑 To'xtatish uchun: Ctrl+C"
echo -e "\n${YELLOW}⏳ Servislar ishlayapti...${NC}"

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID $BOT_PID
