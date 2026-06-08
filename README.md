# Koryaal - Starter Project

Mobile-first internal construction management starter system for engineering/construction companies.

This starter includes:

- Laravel API backend structure
- React + Vite + Tailwind frontend structure
- Database migrations design
- First working page: **Add WhatsApp Report**
- Simple parser for engineer WhatsApp messages like:

```txt
5 fuundi x15.5 = 77.5
3 shaqaale x7.5 = 22.5
matoor = 35
Matoor 8
15 farsamo yaqaan pom

```

---

## Folder structure

```txt
Koryaal/
  backend/    Laravel API starter files
  frontend/   React/Vite starter files
```

---

# HOW TO RUN

## Requirements

Install these first:

- PHP 8.2+
- Composer
- MySQL / MariaDB, for example XAMPP
- Node.js 18+
- npm

Check versions:

```bash
php -v
composer -V
node -v
npm -v
```

---

## Option A: Run frontend only first, easiest test

The React page has a local parser, so you can test the **Add WhatsApp Report** page even before backend is fully ready.

```bash
cd Koryaal/frontend
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

Then go to **Add WhatsApp Report**, paste this sample, and click **Extract Preview**:

```txt
5 fuundi x15.5 = 77.5
3 shaqaale x7.5 = 22.5
matoor = 35
Matoor 8
15 farsamo yaqaan pom

```

You should see extracted rows, calculated total, provided total, difference, and review status.

---

## Option B: Run full backend + frontend

### Step 1: Create a real Laravel project

Important: the provided `backend/` folder is a starter code folder, not a full Laravel installation with `vendor/`.

From inside `Koryaal/`, run:

```bash
composer create-project laravel/laravel backend-real
```

Then install useful packages:

```bash
cd backend-real
composer require laravel/sanctum maatwebsite/excel barryvdh/laravel-dompdf spatie/laravel-permission
php artisan install:api
```

### Step 2: Copy starter backend files into Laravel

From `Koryaal/`, copy these folders/files:

```txt
backend/app
backend/database
backend/routes/api.php
```

Into:

```txt
backend-real/app
backend-real/database
backend-real/routes/api.php
```

On Windows, you can copy manually using File Explorer.

On terminal:

```bash
# From Koryaal folder
cp -r backend/app/* backend-real/app/
cp -r backend/database/* backend-real/database/
cp backend/routes/api.php backend-real/routes/api.php
```

### Step 3: Setup `.env`

In `backend-real/.env`, set your database. Example for XAMPP/MySQL:

```env
APP_NAME=Koryaal
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=koryaal_company_db
DB_USERNAME=root
DB_PASSWORD=
```

Create database in phpMyAdmin:

```sql
CREATE DATABASE koryaal_company_db;
```

### Step 4: Run migrations

```bash
php artisan migrate
```

Optional demo seed:

```bash
php artisan db:seed --class=BuildTrackDemoSeeder
```

### Step 5: Start Laravel API

```bash
php artisan serve
```

Backend URL:

```txt
http://127.0.0.1:8000
```

API URL:

```txt
http://127.0.0.1:8000/api
```

Test parser endpoint:

```bash
curl -X POST http://127.0.0.1:8000/api/parse-report \
  -H "Content-Type: application/json" \
  -d '{"message":"5 fuundi x15.5 = 77.5\n3 shaqaale x7.5 = 22.5\nmatoor = 35\nMatoor 8\n15 farsamo yaqaan pom\nTotal = 158"}'
```

### Step 6: Start React frontend

Open a second terminal:

```bash
cd Koryaal/frontend
npm install
npm run dev
```

Frontend URL:

```txt
http://localhost:5173
```

Make sure `frontend/.env` contains:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

# What to test first

1. Open `http://localhost:5173`
2. Go to **Add WhatsApp Report**
3. Select/write project name
4. Add report date
5. Paste engineer message
6. Choose payment method: EVC Plus, E-Dahab, Bank, Cash, or Not Provided
7. Upload invoice/payment image if needed
8. Click **Extract Preview**
9. Check extracted rows
10. Click **Submit / Save** if backend is running

---

# Current MVP workflow

```txt
Engineer message
→ Admin/Engineer enters report
→ Upload invoice/payment proof
→ Parser extracts rows
→ Admin reviews extracted rows
→ Save report/transactions
→ Later: monthly PDF/Excel/CSV report
```

---

# What works first

- Add WhatsApp Report UI
- Local parser preview in React
- Laravel parser service
- Database migration structure
- Payment methods: EVC Plus, E-Dahab, Bank, Cash, Other, Not Provided
- Total check: engineer total vs calculated total
- Needs-review flag for unclear lines

---

# Next development steps

1. Add real login with Laravel Sanctum
2. Add Projects CRUD page
3. Add Admin Review page
4. Save each extracted row as a transaction
5. Add invoice/payment proof upload storage
6. Add PDF/Excel/CSV exports
7. Add monthly report page
8. Add Gemini API parser later for smarter WhatsApp/invoice reading

---

# Troubleshooting

## `npm install` error

Run:

```bash
npm cache clean --force
npm install
```

## Laravel database error

Check:

- MySQL/XAMPP is running
- Database name exists: `koryaal_company_db`
- `.env` DB settings are correct

Then run:

```bash
php artisan config:clear
php artisan migrate:fresh
```

## CORS/API issue

Make sure backend is running:

```txt
http://127.0.0.1:8000
```

And frontend `.env` is:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Restart frontend after editing `.env`:

```bash
npm run dev
```


## IMPORTANT FIXES

### 1) Backend error: `Could not open input file: artisan`

The `backend` folder in this ZIP contains starter Laravel files only. It is not a full Laravel installation yet, so `artisan` will not exist until you create a Laravel project.

Run this from `C:\Users\hp\Downloads\Koryaal`:

```bash
composer create-project laravel/laravel backend
```

Then copy the starter backend files into the real Laravel project:

```bash
xcopy backend backend /E /I /Y`r`ncd backend
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Use this backend URL:

```text
http://127.0.0.1:8000
```

### 2) Frontend Tailwind error

This starter now uses Tailwind CSS v3 to avoid the Tailwind v4 PostCSS error.

From the frontend folder, delete old installed packages and reinstall:

```bash
cd C:\Users\hp\Downloads\Koryaal\frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### 3) Correct frontend command

Do not type frontend path while you are inside backend. Open a new CMD window and run:

```bash
cd C:\Users\hp\Downloads\Koryaal\frontend
npm run dev
```

