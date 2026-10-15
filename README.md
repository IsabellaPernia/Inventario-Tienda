# Inventario de productos

Aplicación para que una pequeña tienda administre su inventario: lista de productos, consulta por ID, alta, edición, baja, búsqueda por nombre o SKU y filtro por categoría.

| Capa | Tecnología |
| --- | --- |
| Base de datos | MySQL 8 (instalado en tu máquina) |
| Backend | NestJS 12 + TypeORM, API REST en `http://localhost:3000/api` |
| Frontend | React 19 + Vite + TypeScript, en `http://localhost:5173` |

## Estructura

```
.
├── database/
│   ├── schema.sql     # Crea la base `catalogo` y las tablas categories y products
│   └── seed.sql       # Datos de ejemplo (opcional)
├── backend/           # API NestJS
└── frontend/          # Interfaz React
```

## Requisitos

- **Node.js 22.22.3 o superior** (o 24 LTS) y npm. NestJS 12 declara ese mínimo; con versiones 22 anteriores funciona pero npm muestra advertencias `EBADENGINE`.
- **MySQL 8.0.16 o superior**. Las restricciones `CHECK` (precio > 0, stock >= 0) solo se aplican desde esa versión; en versiones anteriores MySQL las acepta e ignora.
- Git.

## Puesta en marcha

Se necesitan tres terminales (o una, ejecutando los pasos en orden).

### 1. Base de datos

Con el servidor MySQL corriendo, importa el esquema y, si quieres datos de prueba, el seed:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql   # opcional
```

Esto crea la base `catalogo` con las tablas `categories` y `products`. El seed agrega 5 categorías y 8 productos.

Para empezar de cero, borra la base y repite los dos comandos (el esquema no sobrescribe tablas existentes):

```bash
mysql -u root -p -e "DROP DATABASE catalogo"
```

> **Linux, error «Access denied for user root»:** en algunas instalaciones `root` solo entra por socket. Crea un usuario propio y úsalo en el paso siguiente:
>
> ```sql
> CREATE USER 'inventario'@'localhost' IDENTIFIED BY 'cambia-esta-clave';
> GRANT ALL ON catalogo.* TO 'inventario'@'localhost';
> ```

### 2. Backend

```bash
cd backend
cp .env.example .env     # en Windows: copy .env.example .env
```

Edita `.env` con los datos de tu MySQL (`DB_USER`, `DB_PASSWORD`; el resto trae valores por defecto):

```
PORT=3000
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=catalogo
```

Instala y arranca:

```bash
npm install
npm run start:dev        # modo desarrollo, recarga al guardar
```

Debe imprimir `API lista en http://localhost:3000/api`. Prueba rápida: abre <http://localhost:3000/api/products> en el navegador.

Para producción: `npm run build` y luego `npm run start:prod`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:5173>. En desarrollo, Vite redirige `/api` hacia `http://localhost:3000`, así que no hay que configurar nada si el backend usa el puerto 3000. Si lo cambias, edita el `target` del proxy en `frontend/vite.config.ts` o define `VITE_API_URL` (ver `frontend/.env.example`).

## Qué hace la aplicación

| Requisito | API | Interfaz |
| --- | --- | --- |
| Ver la lista de productos | `GET /api/products` | Pestaña «Productos», con paginación |
| Consultar un producto por ID | `GET /api/products/:id` | Solo API |
| Crear un producto | `POST /api/products` | «Nuevo producto» |
| Actualizar un producto | `PATCH /api/products/:id` | «Editar» |
| Eliminar un producto | `DELETE /api/products/:id` | «Eliminar» (pide confirmación) |
| Buscar por nombre o SKU | `GET /api/products?search=texto` | Cuadro de búsqueda |
| Filtrar por categoría | `GET /api/products?categoryId=3` | Selector de categoría |

La pestaña «Categorías» permite crear, renombrar y eliminar categorías, y muestra cuántos productos tiene cada una.

## API

Base: `http://localhost:3000/api`. Todas las respuestas son JSON; los errores traen `message` y `statusCode`.

### Productos

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/products` | Lista paginada | `200` |
| GET | `/products/:id` | Un producto, con su categoría | `200` / `404` |
| POST | `/products` | Crea un producto | `201` / `400` / `409` |
| PATCH | `/products/:id` | Actualiza campos (parcial) | `200` / `400` / `404` / `409` |
| DELETE | `/products/:id` | Elimina el producto | `204` / `404` |

Parámetros de `GET /products` (todos opcionales y combinables):

| Parámetro | Descripción |
| --- | --- |
| `search` | Texto contenido en `name` o `sku` |
| `categoryId` | Solo productos de esa categoría |
| `isActive` | `true` o `false` |
| `page` | Página, desde 1 (por defecto 1) |
| `limit` | Resultados por página, 1–100 (por defecto 10) |

La lista responde `{ "data": [...], "total": 8, "page": 1, "limit": 10, "totalPages": 1 }`.

Ejemplo de creación:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Arroz 1 kg","sku":"ARR-001","price":1.25,"stock":50,"categoryId":1}'
```

### Categorías

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/categories` | Lista con `productCount` | `200` |
| GET | `/categories/:id` | Una categoría | `200` / `404` |
| POST | `/categories` | Crea una categoría | `201` / `400` / `409` |
| PATCH | `/categories/:id` | Renombra | `200` / `404` / `409` |
| DELETE | `/categories/:id` | Elimina | `204` / `404` / `409` |

### Reglas de validación

| Campo | Regla |
| --- | --- |
| `name` (producto) | Obligatorio, hasta 150 caracteres |
| `sku` | Obligatorio, hasta 100 caracteres, único |
| `description` | Opcional |
| `price` | Obligatorio, mayor que 0, hasta 2 decimales |
| `stock` | Obligatorio, entero mayor o igual a 0 |
| `categoryId` | Obligatorio, debe existir |
| `isActive` | Opcional, `true` por defecto |
| `name` (categoría) | Obligatorio, hasta 100 caracteres, único |

Campos desconocidos en el cuerpo se rechazan con `400`. Un SKU o nombre de categoría repetido responde `409`. Una categoría con productos no se puede eliminar (`409`); hay que mover o borrar sus productos antes.

## Pruebas y verificación

```bash
cd backend && npm test        # validaciones de los DTO
cd backend && npm run build   # compila el backend
cd frontend && npm run build  # comprueba tipos y genera el bundle
cd frontend && npm run lint
```

## Notas

- **`.npmrc` con `legacy-peer-deps=true`** en `backend/` y `frontend/`: npm 10 falla con el árbol de dependencias de Vitest/Vite del scaffold de NestJS (`Cannot read properties of null (reading 'edgesOut')`). Con esa opción `npm install` funciona sin pasos extra.
- **El esquema lo crea `database/schema.sql`**, no TypeORM: `synchronize` está desactivado para que la base solo cambie cuando tú ejecutes SQL.
- **Eliminar un producto es definitivo.** Para retirarlo del catálogo sin perder el registro, edítalo y desmarca «Producto activo».
- Cada producto pertenece a una sola categoría y las categorías son planas (sin subcategorías).
- Los precios se muestran en USD (formato `en-US`); la base guarda solo el número.
