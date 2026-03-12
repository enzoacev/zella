# ZELLA — White-Label Loyalty SaaS

Plataforma de fidelización con **backend Node.js + Express + SQLite** y **frontend React + Vite**.

---

## 🏗️ Arquitectura

```
zella/
├── backend/                    ← Node.js API
│   ├── prisma/
│   │   ├── schema.prisma       ← SQLite schema
│   │   └── seed.js             ← datos de demo
│   ├── src/
│   │   ├── index.js            ← Express server
│   │   ├── middleware/auth.js  ← JWT middleware
│   │   └── routes/
│   │       ├── auth.js         ← login / register
│   │       ├── admin.js        ← Super Admin CRUD
│   │       ├── merchant.js     ← panel de comercio
│   │       └── customer.js     ← billetera del socio
│   ├── Dockerfile
│   └── package.json
├── src/                        ← React frontend
│   ├── services/api.js         ← cliente HTTP (fetch)
│   ├── components/
│   │   ├── auth/Login.jsx
│   │   ├── superadmin/
│   │   ├── merchant/
│   │   └── customer/
│   └── ...
├── nginx/default.conf          ← proxy /api → backend
├── docker-compose.yml
└── Dockerfile                  ← frontend build
```

---

## 🚀 Inicio Rápido

### Opción 1 — Local (Node.js requerido)

```bash
# 1. Levantar backend
cd backend
cp .env.example .env
npm install
npx prisma db push
node prisma/seed.js
npm run dev           # → http://localhost:3001

# 2. Levantar frontend (nueva terminal)
cd ..
npm install
npm run dev           # → http://localhost:5173
```

### Opción 2 — Docker (recomendado, todo en uno)

```bash
docker compose up --build
```

- **Frontend**: http://localhost
- **API**:       http://localhost:3001
- **DB**:        volumen persistente `db_data`

---

## 🔐 Credenciales de Demo

| Rol             | Email / DNI        | Contraseña / PIN |
|-----------------|--------------------|------------------|
| **Super Admin** | admin@zella.app    | admin123         |
| **Café Selva**  | cafe@zella.app     | cafe123          |
| **Pizza Napoli**| pizza@zella.app    | pizza123         |
| **Sushi Zen**   | sushi@zella.app    | sushi123         |
| **Burger Lab**  | burgers@zella.app  | burgers123       |
| **Socio Ana**   | DNI 30123456       | PIN 1234         |
| **Socio Carlos**| DNI 25678901       | PIN 5678         |
| **Socio María** | DNI 33445566       | PIN 9012         |

---

## 🔌 API Endpoints

### Auth
| Método | Ruta                        | Descripción                |
|--------|-----------------------------|----------------------------|
| POST   | `/api/auth/login`           | Login admin/merchant       |
| POST   | `/api/auth/customer-login`  | Login socio (DNI + PIN)    |
| POST   | `/api/auth/register`        | Registro nuevo socio       |

### Super Admin (Bearer token requerido)
| Método | Ruta                               | Descripción                  |
|--------|------------------------------------|------------------------------|
| GET    | `/api/admin/overview`              | Métricas globales            |
| GET/POST | `/api/admin/merchants`           | Listar / crear comercios     |
| PUT/DELETE | `/api/admin/merchants/:id`   | Editar / eliminar comercio   |
| GET/POST | `/api/admin/customers`           | Listar / crear socios        |
| PUT/DELETE | `/api/admin/customers/:id`   | Editar / eliminar socio      |
| POST   | `/api/admin/customers/:id/stamp`   | Agregar sellos manualmente   |
| POST   | `/api/admin/customers/:id/coupon`  | Emitir cupón manual          |
| DELETE | `/api/admin/cards/:id`             | Eliminar tarjeta             |
| DELETE | `/api/admin/coupons/:id`           | Eliminar cupón               |
| GET/PUT | `/api/admin/brand`               | Marca global de plataforma   |
| GET    | `/api/admin/billing`               | Historial de facturación     |

### Merchant
| Método | Ruta                                | Descripción              |
|--------|-------------------------------------|--------------------------|
| GET    | `/api/merchant/me`                  | Datos del comercio       |
| GET    | `/api/merchant/stats`               | Tarjetas, cupones, txs   |
| POST   | `/api/merchant/stamp`               | Acreditar sellos         |
| GET    | `/api/merchant/customer-by-dni/:dni`| Buscar socio por DNI     |
| PUT    | `/api/merchant/brand`               | Actualizar branding      |
| PUT    | `/api/merchant/rules`               | Actualizar reglas        |

### Customer
| Método | Ruta                    | Descripción               |
|--------|-------------------------|---------------------------|
| GET    | `/api/customer/wallet`  | Tarjetas + cupones        |
| GET    | `/api/customer/explore` | Comercios + mis progresos |
| POST   | `/api/customer/redeem`  | Canjear cupón con PIN     |

---

## 🛠️ Tech Stack

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite 5                   |
| Backend    | Node.js + Express 4                 |
| Base de datos | SQLite (via Prisma ORM)          |
| Auth       | JWT (jsonwebtoken + bcryptjs)       |
| Deploy     | Docker + nginx (multi-stage)        |

---

## ⚙️ Variables de Entorno

```env
# backend/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambiar_en_produccion"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

```env
# frontend .env (opcional)
VITE_API_URL=/api
```
