# tarea-jwt-usuarios

Tarea **JWT + Usuarios** del curso Diseño de Software (ITCR). Parte del proyecto `Semana 9/tasks-api` del repositorio del curso y completa los pasos 5, 6 y 7 de [TUTORIAL.md](./TUTORIAL.md):

- **Paso 5:** CRUD de tareas con validación (zod) y errores consistentes.
- **Paso 6:** documentación con Swagger (OpenAPI 3.1) generada desde los schemas de zod.
- **Paso 7:** registro, login y protección de `/api/tasks` con JWT.

Web API en Node.js (Express 5) organizada por capas (routes, controller, service, repository) que usa **Supabase** (Postgres) como base de datos.

## Requisitos

- Node.js 20.6 o superior (usa `--env-file` y `--watch`)
- Un proyecto en [Supabase](https://supabase.com)
- Postman, para la colección de `postman/` (opcional)

## Puesta en marcha

1. En Supabase, abrir **SQL Editor** y ejecutar en este orden:
   - `supabase/01_tasks.sql`: tabla `tasks` con datos de ejemplo.
   - `supabase/02_auth.sql`: tabla `users` (email único y `password_hash`).
2. Copiar `.env.example` a `.env` y completar los valores:

   | Variable              | Descripción |
   |-----------------------|-------------|
   | `PORT`                | Puerto de la API (por defecto `3000`) |
   | `SUPABASE_URL`        | Project URL (Project Settings, API Keys) |
   | `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) o la clave `service_role`. Solo se usa en el servidor |
   | `JWT_SECRET`          | Secreto para firmar los tokens, al menos 32 caracteres |
   | `JWT_EXPIRES_IN`      | Duración del token, por defecto `1h` |

   Para generar `JWT_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

3. Instalar y levantar:

   ```bash
   npm install
   npm run dev
   ```

4. Abrir la documentación interactiva en **http://localhost:3000/api/docs**.

## Autenticación

1. `POST /api/auth/register` con `{ "email", "password" }` crea el usuario. La contraseña se guarda como hash bcrypt y nunca se devuelve.
2. `POST /api/auth/login` devuelve `{ "accessToken", "tokenType": "Bearer", "expiresIn" }`.
3. Las rutas protegidas reciben el header `Authorization: Bearer <accessToken>`. Sin token, con un token alterado o expirado la respuesta es `401`.

Todas las rutas de `/api/tasks` y `GET /api/auth/me` requieren token. Health, docs, registro y login son públicos.

En Swagger, después del login se presiona **Authorize** y se pega el `accessToken` (sin escribir "Bearer").

## Endpoints

| Método | Ruta                     | Token | Descripción |
|--------|--------------------------|-------|-------------|
| GET    | `/api/docs`              | No    | Swagger UI |
| GET    | `/api/docs/openapi.json` | No    | Especificación OpenAPI (JSON) |
| GET    | `/api/health`            | No    | La API está viva |
| GET    | `/api/health/db`         | No    | La API llega a Supabase |
| POST   | `/api/auth/register`     | No    | Registrar usuario (`email`, `password` de 8 a 72 caracteres) |
| POST   | `/api/auth/login`        | No    | Iniciar sesión y obtener el token |
| GET    | `/api/auth/me`           | Sí    | Usuario dueño del token (`id`, `email`) |
| GET    | `/api/tasks`             | Sí    | Listar tareas |
| GET    | `/api/tasks/:id`         | Sí    | Obtener una tarea |
| POST   | `/api/tasks`             | Sí    | Crear (`title`, `description?`, `done?`) |
| PATCH  | `/api/tasks/:id`         | Sí    | Actualizar parcialmente |
| DELETE | `/api/tasks/:id`         | Sí    | Eliminar |

Errores siempre con la forma `{ "error": { "message": "...", "details": [...] } }`.

## Pruebas

Con la API levantada:

- **Postman:** importar `postman/tarea-jwt-usuarios.postman_collection.json` y ejecutar la colección completa (Run collection). Está organizada en Health, Auth, Tasks y Errores. El registro genera credenciales de prueba nuevas en cada ejecución y el login guarda el token en la variable `token`. La captura de la colección está en `evidencias/postman_coleccion.png`.
- **Newman** (runner de Postman por línea de comandos):

  ```bash
  npx newman run postman/tarea-jwt-usuarios.postman_collection.json
  ```

- **REST Client:** `requests.http` recorre el mismo flujo desde VS Code.

## Estructura

```
src/
├── server.js                 # Arranca el servidor HTTP (solo eso)
├── app.js                    # Construye la app: middlewares, rutas y manejo de errores
├── routes.js                 # Monta los módulos bajo /api
├── config/env.js             # Lee y valida variables de entorno (zod)
├── lib/supabase.js           # Cliente de Supabase
├── lib/jwt.js                # Firma y verificación de tokens (HS256)
├── docs/                     # Swagger: helpers, openapi.js (junta los módulos), docs.routes.js
├── middlewares/              # validate, auth (requireAuth), not-found, error-handler
├── utils/http-error.js       # Error con código HTTP
└── modules/
    ├── health/               # GET /api/health, GET /api/health/db
    ├── auth/
    │   ├── auth.routes.js        # Rutas + composición de dependencias
    │   ├── auth.controller.js    # HTTP  ->  servicio
    │   ├── auth.service.js       # Registro (bcrypt) y login (JWT)
    │   ├── users.repository.js   # Acceso a la tabla users
    │   ├── auth.schema.js        # Credenciales (zod)
    │   └── auth.docs.js          # Documentación OpenAPI del módulo
    └── tasks/
        ├── tasks.routes.js       # Rutas protegidas con requireAuth
        ├── tasks.controller.js   # HTTP  ->  servicio
        ├── tasks.service.js      # Reglas de negocio
        ├── tasks.repository.js   # Acceso a datos (único que conoce Supabase)
        ├── tasks.schema.js       # Schemas zod: validan la entrada y generan la doc
        └── tasks.docs.js         # Documentación OpenAPI del módulo
supabase/
├── 01_tasks.sql              # Tabla tasks + datos de ejemplo
└── 02_auth.sql               # Tabla users (email + hash bcrypt)
postman/                      # Colección de Postman
evidencias/                   # Captura de la colección en Postman
```
