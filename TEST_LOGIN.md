# Login Test Qo'llanmasi

## Muammo: Login ishlamayapti

Agar http://localhost:3000 da kirib bo'lmasa, quyidagilarni tekshiring:

### 1. Servislar ishlamoqdamimi?

```bash
# Backend tekshirish
curl http://localhost:8000/api/auth/login/ -X POST -H "Content-Type: application/json" -d '{"login":"fergan","password":"123"}'

# Frontend tekshirish
curl http://localhost:3000
```

### 2. Browser Console ni oching

1. Browser da F12 bosing
2. Console tab ni oching
3. Xatoliklarni ko'ring

### 3. Login ma'lumotlari

- **Username:** `fergan`
- **Password:** `123`

### 4. Servislarni qayta ishga tushirish

```bash
# Backend
cd backend
python3 manage.py runserver 8000

# Frontend (yangi terminal)
npm run dev
```

### 5. Muammo hal qilinmasa

Browser console da quyidagi xatoliklarni qidiring:
- Network errors
- CORS errors
- JavaScript errors
- API connection errors


