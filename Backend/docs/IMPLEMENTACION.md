# Implementación de Cátedra I

Este documento describe las funciones completadas sobre el backend existente, sus reglas, archivos y pruebas. Las rutas incompletas y el controlador que devolvía `501` se sustituyeron por implementaciones reales. Las pruebas de andamiaje `test.todo` se sustituyeron por pruebas de comportamiento.

## 1. Progreso y estadísticas individuales

**Archivos:** `src/services/progressService.js`, `src/controllers/platform.controller.js`, `src/routes/platform.route.js`.

`GET /api/progress/me` devuelve `totalRecognitions`, `distinctRocks`, `unlockedAchievements` y `discoveryPercentage`. El dueño se obtiene de Bearer o `X-Guest-Token`, nunca de un ID enviado por el cliente.

El porcentaje se calcula con descubrimientos cuyas rocas siguen disponibles en el catálogo. Se redondea a un decimal, devuelve cero si el catálogo está vacío y no supera 100 %. Los descubrimientos históricos permanecen contados aunque una roca haya sido desactivada.

`GET /api/progress/me/history?page=1&limit=20` devuelve `{ items, total, page, limit }`. Ordena por fecha descendente y, en empates, por ID descendente. Incluye la roca histórica incluso si fue desactivada. El límite máximo es 100.

## 2. Logros bloqueados y desbloqueados

**Archivos:** `progressService.js`, `achievementService.js`, `src/models/achievement.js`.

`GET /api/achievement/me` funciona para usuarios e invitados. Cada logro activo incluye `unlocked` y `unlockedAt`; los bloqueados tienen `false` y `null`. Los logros desactivados no aparecen en el catálogo de progreso; sus concesiones históricas se conservan.

Las reglas automáticas siguen usando `distinct_rocks` o `total_recognitions` y un umbral entero positivo. El modelo exige que `conditionType` y `conditionValue` se definan juntos; el evaluador no concede logros con condiciones incompletas. Se mantienen los tres logros iniciales de 1 roca distinta, 3 rocas distintas y 10 reconocimientos.

## 3. Retroalimentación de reconocimientos

**Archivos:** `src/models/feedback.js`, `src/models/index.js`, `src/services/feedbackService.js`, `platform.controller.js`, `platform.route.js`.

Se incorporó la tabla `feedback` con `analysisId` único, `userId`, `isCorrect`, `comment`, `createdAt` y `updatedAt`. La restricción única de SQLite evita evaluaciones duplicadas, incluso si llegan solicitudes simultáneas.

| Método y ruta | Operación |
|---|---|
| `POST /api/recognition/:id/feedback` | Crear una evaluación; responde 201 |
| `GET /api/recognition/:id/feedback` | Consultar la evaluación propia |
| `PATCH /api/recognition/:id/feedback` | Editar `isCorrect` o `comment` |

`isCorrect` debe ser un booleano real. `comment` acepta texto de hasta 2000 caracteres o `null`. Solo el usuario autenticado que realizó el reconocimiento puede evaluarlo. Un reconocimiento ajeno o inexistente devuelve 404; una segunda evaluación devuelve 409. Los invitados no pueden evaluar. Los IDs del dueño y del reconocimiento se asignan en el servidor.

## 4. Migración de invitado a cuenta

**Archivos:** `src/services/guestMigrationService.js`, `src/controllers/user.controller.js`, `platform.route.js`.

Hay dos formas de conservar el progreso:

1. Registrar una cuenta con `POST /api/user/registro` incluyendo `guestToken` en el JSON o `X-Guest-Token` en la cabecera.
2. Usar `POST /api/guest/migrate` con el Bearer de una cuenta existente y `X-Guest-Token`.

En una única transacción SQLite `IMMEDIATE` se valida la sesión, se transfieren colecciones, concesiones de logros e historial de reconocimientos y se marca la sesión como `transferred`. Si una roca ya pertenece al usuario, se suman los contadores y se conserva la fecha más antigua. Si ya posee un logro, se conserva una sola concesión y la fecha más antigua. Se vuelven a evaluar logros sobre el progreso combinado.

La sesión almacena `transferredToUserId` y deja de funcionar para nuevos reconocimientos o consultas. Una nueva transferencia devuelve 409. Un token desconocido o una sesión expirada devuelve 401. Si falla cualquier parte, toda la operación se revierte; en el registro también se revierte la creación de la cuenta. La serialización de escritores evita que dos cuentas reclamen la misma sesión.

## 5. Administración y supervisión

**Archivos:** `src/services/adminService.js`, `platform.controller.js`, `platform.route.js`.

Todas estas rutas requieren JWT válido y rol Admin:

| Ruta | Resultado |
|---|---|
| `GET /api/admin/stats` | Usuarios registrados activos o bloqueados, total de reconocimientos y cinco rocas más reconocidas |
| `GET /api/admin/recognitions` | Historial paginado, con filtros opcionales `userId` y `rockId` |
| `GET /api/admin/feedback` | Evaluaciones paginadas, con filtros `userId` y `analysisId` |
| `PATCH /api/admin/users/:id` | Cambiar `roleId` o `status` |
| `GET /api/admin/users/:id/collection` | Colección del usuario solicitado |
| `GET /api/admin/users/:id/achievements` | Logros activos, con estado de desbloqueo |

Los filtros e IDs deben ser enteros positivos. El usuario debe existir y el rol asignado debe existir. `status` admite `active` o `blocked`. Un administrador no puede bloquearse ni quitarse su propio rol. Las sesiones invitadas no se convierten en cuentas mediante la asignación del rol invitado. La autenticación vuelve a leer el rol y estado de la cuenta en cada petición, de modo que un bloqueo invalida también un JWT previamente emitido.

## 6. Integración real con GeoDex

**Archivos:** `src/services/geodexService.js`, `src/services/recognitionService.js`, `src/app.js`, `.env.example`.

`POST /api/recognition` recibe `image.url` HTTPS o `image.base64` con `mime_type`. Admite JPEG, PNG y WebP. Para base64 verifica formato, firma del archivo y máximo de 8 MB; el cuerpo HTTP completo tiene un límite de 12 MB. Las imágenes por URL las descarga GeoDex; el backend solo transmite la URL. El backend no almacena el base64.

Se utiliza el contrato publicado en `https://geodex-ml-api-76365064073.southamerica-west1.run.app/openapi.json`: petición a `POST /api/v1/identify` con `X-API-Key`, `image`, `observations` opcionales, `candidates` del catálogo local y `top_k: 3`.

La respuesta real fue consultada con una fotografía pública de basalto. La API devolvió `predictions`, `label`, `confidence` en porcentaje y `catalog.rockId`. Esos son los valores predeterminados del adaptador. La mejor predicción se vincula con el catálogo local y después se ejecuta el flujo de colección, logros y cuota. Una predicción desconocida no crea una roca automáticamente: devuelve 422.

Las variables `GEODEX_PREDICTIONS_PATH`, `GEODEX_ROCK_ID_PATH`, `GEODEX_ROCK_NAME_PATH`, `GEODEX_CONFIDENCE_PATH` y `GEODEX_CONFIDENCE_SCALE` permiten ajustar futuros cambios del proveedor. `GEODEX_TIMEOUT_MS` limita la espera. La clave viaja solo al endpoint configurado; no se devuelve al cliente, no se incorpora a mensajes de error y no se siguen redirecciones.

| Condición | Respuesta |
|---|---|
| Imagen inválida o resultado simulado no habilitado | 400 |
| Cuerpo o imagen demasiado grandes | 413 |
| Invitado alcanzó 10 reconocimientos | 403, `GUEST_LIMIT_REACHED` |
| Roca fuera del catálogo | 422, `ROCK_NOT_IN_CATALOG` |
| Proveedor falla o responde con formato inválido | 502 |
| Falta clave o cuota externa agotada | 503 |
| Tiempo de espera agotado | 504 |

La llamada externa sucede antes de la transacción de escritura para no bloquear SQLite mientras se espera a GeoDex. Al persistir se vuelve a validar la vigencia y cuota del invitado. Una respuesta fallida no aumenta el contador local ni guarda un reconocimiento. Dos llamadas simultáneas podrían consumir cuota del proveedor, pero el límite local sigue siendo de diez registros confirmados.

El antiguo JSON `{ rockId, confidence }` se permite exclusivamente con `ALLOW_SIMULATED_RECOGNITION=true` y fuera de producción. Está deshabilitado por defecto. Las pruebas lo habilitan explícitamente.

## 7. Integridad, autenticación y configuración

- `src/config/auth.js`: centraliza el secreto JWT y exige `JWT_SECRET` en producción. La verificación limita el algoritmo a HS256.
- `user.controller.js`: valida tipos y tamaños, normaliza el correo, limita contraseñas a 72 bytes para bcrypt y devuelve 409 por datos únicos duplicados. Registro y perfil siguen excluyendo rol y estado enviados por usuarios.
- `recognitionService.js`: transacciones `IMMEDIATE`, comprobación de sesión dentro de la transacción y restauración controlada de una colección eliminada lógicamente para evitar colisiones con su índice único.
- `src/models/collection.js`: exige exactamente un dueño y un contador entero positivo.
- `src/models/rock.js`: exige descripción no vacía en nuevas escrituras; las pruebas del catálogo incorporan este campo obligatorio de la pauta.
- `app.js` y `crudService.js`: la API de `user-achievement` usa ambas claves (`userId`, `achievementId`) y permite crearlas sin permitir cambiarlas mediante PATCH.
- `seedDemoData.js`: añade el rol de invitado sin duplicar los datos existentes. Las sesiones invitadas continúan siendo identidades separadas de `User`.
- `src/database/initialize.js`: `npm run migrate` inicializa las tablas y seeders en la misma base que usa el servidor. No borra ni altera tablas existentes. Para la versión revisada, la incorporación persistente es la nueva tabla de feedback; no requiere borrar la base existente.
- `package.json`: declara Node.js >=22 y mantiene Morgan como dependencia de ejecución, disponible al instalar sin dependencias de desarrollo.
- `.env.example`: documenta todas las variables sin credenciales. El `.env` local conserva las credenciales fuera de Git.

## 8. Pruebas

`npm test` ejecuta la suite con `node:test`. Las pruebas usan bases SQLite temporales `test_*`, cierran conexiones y eliminan sus archivos. No utilizan ni modifican la base local `rock.sqlite`.

`test/platform.test.js` cubre aislamiento entre usuarios e invitados, paginación, logros bloqueados, feedback único y privado, migración y fusión de datos, rollback del registro, transferencia concurrente, cuota concurrente, permisos administrativos, bloqueo de cuentas, protección del propio administrador, catálogo vacío y acceso por clave compuesta.

`test/geodex.test.js` cubre normalización del contrato real, variaciones configurables, validación de imágenes, límites, errores del proveedor y un flujo HTTP completo con proveedor local controlado. `test/fixtures/geodex-response.json` contiene la respuesta de prueba del proveedor a una imagen pública y no contiene credenciales. Las pruebas automáticas nunca gastan cuota de GeoDex.

Se conservan las pruebas anteriores de autenticación, catálogo, CRUD, inicio del servidor y seeders. La comprobación real con GeoDex es adicional y requiere la clave local; no se ejecuta automáticamente con `npm test`.

### Resultado de la verificación del 15 de octubre de 2026

- Suite completa: 48 pruebas aprobadas, 0 fallos, 0 omitidas y 0 pendientes, ejecutadas con Node.js 24.
- Consulta directa a GeoDex con dos candidatos: respuesta válida con Basalto y confianza del 72 %; se conservó como fixture sin credenciales.
- Flujo completo por HTTP con los cuatro candidatos iniciales: respuesta 201, Pizarra con confianza del 58 %, un reconocimiento persistido, una roca en la colección y un logro desbloqueado. Esta prueba verifica la integración y persistencia; la clasificación concreta depende del modelo y de los candidatos.
- Revisión de archivos: la clave de GeoDex aparece únicamente en `.env`; no se incluye en fuentes, pruebas ni documentación.
