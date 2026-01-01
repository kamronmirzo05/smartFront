# ✅ Servislar Holati

## 🟢 Barcha Servislar Ishlamoqda!

### Backend Server
- **Status:** ✅ ISHLAYAPTI
- **Port:** 8000
- **URL:** http://localhost:8000
- **API:** http://localhost:8000/api/
- **Admin:** http://localhost:8000/admin/

### Frontend Server
- **Status:** ✅ ISHLAYAPTI
- **Port:** 3000
- **URL:** http://localhost:3000

### Telegram Bot
- **Status:** ✅ ISHLAYAPTI
- **Process:** Background da ishlamoqda

## 🔐 Kirish Ma'lumotlari

### Django Admin
- **URL:** http://localhost:8000/admin/
- **Username:** `admin`
- **Password:** `123`

### Application
- **URL:** http://localhost:3000
- **Username:** `superadmin`
- **Password:** `123`

## 📊 Test Natijalari

✅ Backend API login endpoint ishlayapti
✅ Frontend HTML qaytaryapti
✅ Django admin panel ishlayapti
✅ Barcha portlar band

## 🛑 Servislarni To'xtatish

```bash
# Barcha processlarni to'xtatish
pkill -f "runserver\|vite\|bot.py"
```

Yoki alohida:
```bash
# Backend
lsof -ti:8000 | xargs kill

# Frontend
lsof -ti:3000 | xargs kill

# Bot
pkill -f bot.py
```

## 📝 Eslatmalar

- Barcha servislar background da ishlamoqda
- Ma'lumotlar backenddan keladi
- Mock ma'lumotlar yo'q
- Production uchun tayyor

