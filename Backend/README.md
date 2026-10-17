# Backend de reconocimiento de rocas

API REST para una aplicación móvil: autenticación, catálogo de rocas, reconocimiento de imágenes mediante GeoDex, colecciones, logros, progreso, feedback, invitados y administración. Utiliza Node.js, Express, Sequelize, SQLite, JWT, bcryptjs, dotenv, CORS y Morgan. La organización separa configuración, modelos, rutas, controladores, servicios, middlewares y utilidades.

El detalle de cada función completada, sus archivos y reglas se encuentra en [docs/IMPLEMENTACION.md](docs/IMPLEMENTACION.md).

## Instalación y ejecución

Requiere Node.js 22 o superior. Ejecuta desde la carpeta `Backend`:

```powershell
npm ci
# Solo si todavía no existe un .env:
Copy-Item .env.example .env
```

Completa `JWT_SECRET`, `ADMIN_PASSWORD` y `GEODEX_API_KEY` en `.env`. Para generar un secreto local:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

La clave GeoDex se obtiene mediante la invitación indicada por el docente en [GeoDex signup](https://geodex-ml-api-76365064073.southamerica-west1.run.app/signup). La clave se queda en el servidor y nunca debe enviarse desde la aplicación móvil ni subirse al repositorio.

```powershell
npm start
# Desarrollo con recarga automática:
npm run dev
# Crear tablas faltantes y datos iniciales sin iniciar HTTP:
npm run migrate
# Pruebas aisladas, sin consumir la API externa:
npm test
```

El servidor escucha por defecto en `http://localhost:8080` después de conectar a SQLite, crear las tablas faltantes y ejecutar los seeders. La base se guarda en `src/database/rock.sqlite`. `DATABASE_NAME` cambia el nombre del archivo en esa misma carpeta. La inicialización es idempotente: conserva datos existentes y no utiliza `force` ni `alter`. El comando `migrate` realiza esta inicialización; no aplica automáticamente cambios arbitrarios de columnas a versiones antiguas del proyecto.

## Variables de entorno

| Variable | Función / valor por defecto |
|---|---|
| `NODE_ENV` | `development`; usar `production` al desplegar |
| `PORT` | `8080` |
| `DATABASE_NAME` | `rock`, sin extensión ni ruta |
| `JWT_SECRET` | Secreto de firma; obligatorio en producción |
| `JWT_EXPIRES_IN` | `1d` |
| `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Cuenta inicial de administrador |
| `GUEST_SESSION_TTL_HOURS` | `72` |
| `GEODEX_API_URL` | URL base publicada de GeoDex |
| `GEODEX_API_KEY` | Clave privada del proveedor |
| `GEODEX_TIMEOUT_MS` | `30000`, rango 100–120000 |
| `GEODEX_PREDICTIONS_PATH` | `predictions` |
| `GEODEX_ROCK_ID_PATH` | `catalog.rockId` |
| `GEODEX_ROCK_NAME_PATH` | `label` |
| `GEODEX_CONFIDENCE_PATH` | `confidence` |
| `GEODEX_CONFIDENCE_SCALE` | `percent`; admite `fraction` para otra configuración del proveedor |
| `ALLOW_SIMULATED_RECOGNITION` | `false`; permite JSON simulado solo fuera de producción |

Fuera de producción, el código conserva los valores de demostración de la base anterior para JWT y administrador cuando no se configuran. El `.env` local debe definir valores propios. En producción se exige `JWT_SECRET` y `ADMIN_PASSWORD`. El seeder no cambia la contraseña de un usuario que ya existe.

## Autenticación y perfiles

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/user/registro` | Público; crea siempre un usuario autenticado |
| POST | `/api/user/login` | Público; devuelve JWT y usuario sin contraseña |
| GET / PATCH | `/api/user/me` | Bearer; consulta o edita nombre y teléfono propios |
| GET | `/api/user` y `/api/user/:id` | Admin |

Registro:

```json
{ "userName": "ana", "email": "ana@example.test", "password": "UnaClaveLocal123!", "phone": "123456789" }
```

`userName`, `email` y `password` son obligatorios. La contraseña requiere 8 caracteres como mínimo y hasta 72 bytes. El correo se normaliza a minúsculas. Los datos únicos duplicados devuelven 409. El cliente no puede asignarse rol ni estado mediante registro o perfil.

Después de iniciar sesión, envía `Authorization: Bearer <token>`. Cada petición valida firma, vencimiento, existencia, estado y rol actual del usuario. Las cuentas bloqueadas no pueden iniciar sesión ni reutilizar tokens anteriores.

## Catálogo y administración de recursos

| Recurso | Prefijo | Lectura | Escritura |
|---|---|---|---|
| Rocas | `/api/rock` | Pública | Admin |
| Tipos | `/api/type` | Pública | Admin |
| Categorías | `/api/category` | Pública | Admin |
| Definiciones de logros | `/api/achievement` | Pública | Admin |
| Roles | `/api/role` | Admin | Admin |
| Registros de análisis | `/api/analysis` | Admin | Admin |
| Registros de colección | `/api/collection` | Admin | Admin |
| Concesiones de logros | `/api/user-achievement` | Admin | Admin |

Los recursos genéricos exponen `GET /`, `POST /`, `GET /:id`, `PATCH /:id` y `DELETE /:id`. El listado devuelve `{ items, total, page, limit }`; el borrado correcto devuelve 204. La API de concesiones usa `/:userId/:achievementId` para operaciones individuales. Los endpoints propios `/me` tienen prioridad sobre los genéricos.

Las escrituras directas de análisis, colecciones o concesiones son herramientas administrativas de la base existente; no ejecutan el flujo de reconocimiento ni recalculan logros. Para registrar un descubrimiento completo utiliza `/api/recognition`.

Los listados aceptan `page`, `limit` (20 por defecto, máximo 100), `search` y `searchBy` restringido a los campos del recurso. Filtros de roca: `GET /api/rock?typeId=1&categoryId=2`. También existen `GET /api/type/:id/rocks` y `GET /api/category/:id/rocks`. No se pueden eliminar tipos o categorías con rocas activas asociadas. Sus nombres son únicos.

`GET /api/rock/dureza?min=5&max=7` filtra por dureza inclusiva. `GET /api/rock/identificar?q=oscuro` es una búsqueda textual sobre propiedades del catálogo.

Ejemplo de roca:

```json
{
  "index": 10, "name": "Basalto de ejemplo", "scientificName": "Basalt example",
  "description": "Roca volcánica oscura de grano fino", "typeId": 1, "categoryId": 1,
  "composition": "Plagioclasa y piroxeno", "formula": "Variable", "environment": "Volcánico",
  "commonUses": "Construcción", "hardness": 6, "streak": "Gris", "color": "Oscuro",
  "texture": "Afanítica", "density": 2.9, "transparency": 0, "tenacity": 1,
  "imgUrl": "https://example.org/basalt.jpg", "mindatUrl": "https://www.mindat.org/"
}
```

Los IDs de tipo y categoría deben existir. `index` y `scientificName` son únicos. Las rocas se eliminan lógicamente. Para desactivar un logro utiliza `PATCH /api/achievement/:id` con `{ "isActive": false }`. Las condiciones automáticas se definen con `conditionType` (`distinct_rocks` o `total_recognitions`) y `conditionValue` entero positivo.

## Invitados y reconocimiento

`POST /api/guest/session` crea una sesión y devuelve `token`, `status`, `recognitionCount`, `limit`, `remaining` y `expiresAt`. El token se devuelve una sola vez y se almacena como hash. El cliente envía `X-Guest-Token: <token>` para usarla. `GET /api/guest/session` consulta su estado.

El límite es de **10 reconocimientos confirmados por sesión**, no por persona. Los usuarios registrados no tienen este límite local; siguen sujetos a la disponibilidad y cuota del proveedor externo.

`POST /api/recognition` requiere Bearer o token de invitado y acepta una imagen:

```json
{
  "image": { "url": "https://upload.wikimedia.org/wikipedia/commons/0/08/BasaltUSGOV.jpg" },
  "observations": { "visibleCrystals": false },
  "note": "Muestra encontrada durante una salida"
}
```

También admite `{ "image": { "base64": "...", "mime_type": "image/jpeg" } }`, sin prefijo `data:`. Formatos: JPEG, PNG y WebP; máximo 8 MB. Las observaciones opcionales disponibles están en [los metadatos de GeoDex](https://geodex-ml-api-76365064073.southamerica-west1.run.app/api/v1/metadata).

El servidor consulta GeoDex con los candidatos del catálogo local, valida su respuesta y persiste el resultado. Devuelve `analysis`, `collection`, `newDiscovery`, `unlockedAchievements` y, para invitados, `guest`. La imagen base64 no se almacena; una URL queda asociada al análisis. Si el proveedor no responde, supera el tiempo de espera o devuelve una roca fuera del catálogo, no se consume el límite local.

En demostraciones locales puede habilitarse `ALLOW_SIMULATED_RECOGNITION=true` para enviar `{ "rockId": 1, "confidence": 92 }`. En producción ese formato siempre se rechaza. La app móvil debe utilizar imágenes.

## Colecciones, progreso y logros

| Ruta | Resultado |
|---|---|
| `GET /api/collection/me` | Colección del usuario autenticado |
| `GET /api/collection/me/:rockId` | Detalle de una roca descubierta por ese usuario |
| `GET /api/progress/me` | Reconocimientos, rocas distintas, logros y porcentaje de descubrimiento |
| `GET /api/progress/me/history` | Historial propio paginado, más reciente primero |
| `GET /api/achievement/me` | Logros activos con `unlocked` y `unlockedAt` |

Progreso, historial y logros aceptan usuarios e invitados. Las consultas de colección requieren cuenta. Cada nueva identificación registra automáticamente la roca en la colección. Una repetida incrementa `recognitionCount` y conserva `firstDiscoveredAt`.

Los seeders definen tres logros automáticos: primera roca distinta, tres rocas distintas y diez reconocimientos. Se conceden una sola vez por dueño y guardan su fecha. El porcentaje de descubrimiento utiliza las rocas que siguen disponibles; es cero con catálogo vacío y nunca supera 100 %.

## Conservar progreso al registrarse

Añade `guestToken` al JSON de registro, o envíalo en `X-Guest-Token`. La cuenta y la transferencia se confirman juntas. Para una cuenta existente, llama `POST /api/guest/migrate` con Bearer y `X-Guest-Token`.

La transferencia combina colecciones, suma contadores, conserva las primeras fechas, evita logros duplicados y mueve el historial de reconocimientos. Después invalida la sesión. Una transferencia repetida devuelve 409 y una sesión expirada devuelve 401.

## Retroalimentación

Un usuario autenticado puede crear una sola evaluación por reconocimiento propio:

```http
POST /api/recognition/1/feedback
Authorization: Bearer <token>
Content-Type: application/json

{ "isCorrect": true, "comment": "Coincide con la muestra" }
```

`GET` sobre la misma ruta consulta la evaluación y `PATCH` permite modificar `isCorrect` o `comment`. El comentario es opcional, admite `null` y hasta 2000 caracteres. Una segunda evaluación devuelve 409; un reconocimiento ajeno devuelve 404. Los invitados no pueden evaluar.

## Supervisión administrativa

| Método y ruta | Operación |
|---|---|
| `GET /api/admin/stats` | Usuarios registrados, reconocimientos y top 5 de rocas |
| `GET /api/admin/recognitions?userId=1&rockId=2` | Historial global paginado con filtros opcionales |
| `GET /api/admin/feedback?userId=1&analysisId=2` | Evaluaciones paginadas con filtros opcionales |
| `PATCH /api/admin/users/:id` | Cambiar `roleId` y/o `status` |
| `GET /api/admin/users/:id/collection` | Colección del usuario |
| `GET /api/admin/users/:id/achievements` | Logros con estado de desbloqueo |

Todas requieren Admin. `status` acepta `active` o `blocked`. El administrador no puede bloquearse ni quitarse su propio rol. Los usuarios inexistentes devuelven 404 y los filtros inválidos 400.

## Errores y pruebas

Las respuestas de error incluyen `message` y, cuando corresponde, `code`. Estados: 400 datos inválidos, 401 autenticación ausente o inválida, 403 permisos o límite de invitado, 404 recurso no encontrado, 409 conflicto, 413 imagen grande, 422 roca fuera del catálogo, 502 respuesta externa inválida, 503 proveedor sin configuración o cuota y 504 tiempo de espera agotado.

`npm test` ejecuta pruebas de autenticación, catálogo, CRUD, colecciones, progreso, feedback, migración, administración, concurrencia e integración HTTP con un proveedor local. Usa bases SQLite temporales y no consume la API real. El detalle de cobertura y las decisiones de implementación están en [docs/IMPLEMENTACION.md](docs/IMPLEMENTACION.md).
