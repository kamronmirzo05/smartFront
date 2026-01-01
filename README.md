# Smart City Dashboard - Farg'ona

Aqlli shahar monitoring tizimi - Farg'ona shahri uchun to'liq funksional platforma.

## 🚀 Tez Boshlash

### Talablar
- Python 3.8+
- Node.js 16+
- npm yoki yarn

### O'rnatish

1. **Backend o'rnatish:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python create_superusers.py
```

2. **Frontend o'rnatish:**
```bash
npm install
```

### Ishga Tushirish

#### Variant 1: Barcha servislarni bir vaqtda ishga tushirish
```bash
bash start_all.sh
```

#### Variant 2: Alohida ishga tushirish

**Backend (8000 port):**
```bash
bash start_backend.sh
# yoki
cd backend
python manage.py runserver 8000
```

**Frontend (3000 port):**
```bash
bash start_frontend.sh
# yoki
npm run dev
```

**Telegram Bot:**
```bash
bash start_bot.sh
# yoki
python bot.py
```

## 🔐 Kirish Ma'lumotlari

### Django Admin Panel
- **URL:** http://localhost:8000/admin/
- **Username:** `admin`
- **Password:** `123`

### Application Login (Farg'ona Shahar)
- **URL:** http://localhost:3000
- **Username:** `fergan`
- **Password:** `123`

## 📡 API Endpoints

Backend API: `http://localhost:8000/api/`

Asosiy endpointlar:
- `/api/auth/login/` - Autentifikatsiya
- `/api/waste-bins/` - Chiqindi qutilari
- `/api/trucks/` - Maxsus texnika
- `/api/facilities/` - Binolar
- `/api/rooms/` - Xonalar
- `/api/boilers/` - Qozonxonalar
- `/api/iot-devices/` - IoT qurilmalar

## 🤖 Telegram Bot

Bot token: `8380253670:AAGdoT2SRVpmHHu47s_ZHF_3l9fuURA-Uo4`

Bot komandalari:
- `/start` - Botni ishga tushirish
- `/scan` - QR kod skaner qilish
- `/help` - Yordam

## 🏗️ Arxitektura

### Backend
- **Framework:** Django 4.2.7
- **API:** Django REST Framework
- **Database:** SQLite (production uchun PostgreSQL)
- **Port:** 8000

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI:** Tailwind CSS + Framer Motion
- **Port:** 3000

### Telegram Bot
- **Library:** python-telegram-bot
- **AI:** Google Gemini API

## 📦 Modullar

### ✅ Faol Modullar (Farg'ona Shahar)
1. **Markaz (Dashboard)** - Asosiy ko'rsatkichlar
2. **Chiqindi (Waste)** - Chiqindi qutilari monitoringi
3. **Issiqlik (Climate)** - Maktab/Bog'cha/Xonalar issiqlik nazorati

### 🔒 Qulf chiqib (Tez orada ishlaydi)
- Namlik (Moisture)
- Havo (Air)
- Xavfsizlik (Security)
- Eco-Nazorat
- Qurilish (Construction)
- Light-AI
- Transport
- Murojaatlar (Call Center)
- Tahlil (Analytics)

## 🔧 Sozlash

### Backend sozlash
`backend/smartcity_backend/settings.py` faylida:
- `DEBUG = True` - Development mode
- `ALLOWED_HOSTS` - Ruxsat berilgan hostlar
- `CORS_ALLOWED_ORIGINS` - CORS sozlamalari

### Frontend sozlash
`services/api.ts` va `services/auth.ts` fayllarida:
- `API_BASE_URL` - Backend API URL

### Bot sozlash
`bot.py` faylida:
- `BOT_TOKEN` - Telegram bot token
- `API_BASE_URL` - Backend API URL

## 📝 Eslatmalar

- Barcha ma'lumotlar backenddan keladi (mock ma'lumotlar yo'q)
- Production uchun PostgreSQL va environment variables ishlatish tavsiya etiladi
- Bot uchun GEMINI_API_KEY environment variable o'rnatish kerak

## 👥 Rollar

- **ADMIN** - Farg'ona shahar boshqaruvi (fergan/123)
- **DRIVER** - Haydovchi dashboard

## 📞 Yordam

Muammo yuzaga kelsa, iltimos issue oching yoki developer bilan bog'laning.

---

**Developer:** CDCGroup  
**Power:** CraDev  
**© 2025 Smart City**
