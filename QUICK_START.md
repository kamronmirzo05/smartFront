# 🚀 Tez Boshlash Qo'llanmasi

## 1️⃣ Barcha Servislarni Bir Vaqtda Ishga Tushirish

```bash
bash start_all.sh
```

Bu script quyidagilarni ishga tushiradi:
- ✅ Backend (8000 port)
- ✅ Frontend (3000 port)  
- ✅ Telegram Bot

## 2️⃣ Alohida Ishga Tushirish

### Backend
```bash
bash start_backend.sh
```
**URL:** http://localhost:8000

### Frontend
```bash
bash start_frontend.sh
```
**URL:** 00

### Telegram Bot
```bash
bash start_bot.sh
```

## 3️⃣ Kirish Ma'lumotlari

### Django Admin Panel
- **URL:** http://localhost:8000/admin/
- **Username:** `admin`
- **Password:** `123`

### Application Dashboard
- **URL:** 00
- **Username:** `superadmin`
- **Password:** `123`

## 4️⃣ Superuser/Superadmin Yaratish

Agar superuser yoki superadmin yaratish kerak bo'lsa:

```bash
cd backend
python3 create_superusers.py
```

## 📝 Eslatmalar

- Barcha ma'lumotlar backenddan keladi (mock ma'lumotlar yo'q)
- Backend 8000 portda ishlaydi
- Frontend 3000 portda ishlaydi
- Telegram bot backend API ga ulanadi

## 🛑 Servislarni To'xtatish

Agar `start_all.sh` orqali ishga tushirilgan bo'lsa:
```bash
# Process ID larni topish
ps aux | grep "runserver\|vite\|bot.py"

# To'xtatish
kill <PID>
```

Yoki alohida terminal oynalarida `Ctrl+C` bosing.

