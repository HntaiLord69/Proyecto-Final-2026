# Documentación de la API — LCC-chan

> **URL Base del servidor:** `https://[URL_DEL_SERVIDOR]/api`

Esta guía describe cómo se comunica tu aplicación frontend con el servidor del foro. El sistema funciona de manera similar a Reddit, pero simplificado: **no hay cuentas de usuario ni contraseñas**. Cualquier persona puede crear subforos, publicar posts escribiendo el nombre de autor que desee, comentar y reaccionar con likes o dislikes.

---

## 1. Conceptos básicos antes de empezar

Todas las peticiones y respuestas de esta API usan **JSON** (`UTF-8`).

- **Encabezado obligatorio al enviar datos (`POST` y `PATCH`):**
  ```http
  Content-Type: application/json
  ```
- **Autenticación:** Ninguna. No necesitas tokens ni cookies.
- **Fechas:** Todas las fechas se envían y reciben en formato estándar **ISO 8601 (UTC)**, por ejemplo `2026-11-18T19:30:00Z`. En JavaScript puedes formatearlas fácilmente con `new Date(fecha).toLocaleString()`.
- **Reglas del sistema:**
  - Los **subforos** se identifican por un nombre único (`name`), pueden editar su descripción, pero **no se pueden eliminar**.
  - Los **posts** pertenecen a un subforo, aceptan una imagen opcional mediante enlace externo (`imageUrl`), y **se pueden editar y eliminar**.
  - Los **comentarios** se consultan en una petición aparte y **no se pueden editar ni eliminar** una vez publicados.
  - Los **likes y dislikes** solo se suman (`+1` por petición).

### Códigos de estado HTTP que devuelve el servidor

| Código                      | Significado         | Cuándo ocurre                                                                                       |
| :-------------------------- | :------------------ | :-------------------------------------------------------------------------------------------------- |
| `200 OK`                    | Éxito               | La consulta (`GET`), edición (`PATCH`) o reacción (`POST .../like`) salió bien.                     |
| `201 Created`               | Recurso creado      | Se creó correctamente un subforo, post o comentario.                                                |
| `204 No Content`            | Eliminado con éxito | Se eliminó un post. La respuesta no trae cuerpo JSON.                                               |
| `400 Bad Request`           | Petición inválida   | Falta un campo obligatorio, un dato tiene formato incorrecto o un parámetro de filtro no es válido. |
| `404 Not Found`             | No encontrado       | El subforo o el post indicado en la URL no existe.                                                  |
| `409 Conflict`              | Conflicto           | Intentaste crear un subforo con un `name` que ya existe.                                            |
| `500 Internal Server Error` | Error del servidor  | Fallo inesperado en el backend.                                                                     |

### Formato estándar de errores

Cuando ocurre un error (`4xx` o `5xx`), el servidor responde siempre con la misma estructura:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Uno o más campos no son válidos.",
    "details": [
      {
        "field": "title",
        "issue": "El título es obligatorio y no puede estar vacío."
      }
    ]
  }
}
```

### Formato estándar de paginación

Los endpoints que devuelven listas paginadas (`GET /subforums` y `GET /subforums/:name/posts`) siempre responden con un objeto que contiene `data` (el arreglo de resultados) y `pagination` (la información para dibujar tus botones de "Anterior" y "Siguiente"):

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 2. Resumen rápido de endpoints

| Recurso         | Método   | Ruta                                      | Acción                                                       |
| :-------------- | :------- | :---------------------------------------- | :----------------------------------------------------------- |
| **Subforos**    | `GET`    | `/subforums`                              | Listar subforos (paginado y ordenable)                       |
| **Subforos**    | `POST`   | `/subforums`                              | Crear un subforo nuevo                                       |
| **Subforos**    | `GET`    | `/subforums/:name`                        | Obtener datos de un subforo                                  |
| **Subforos**    | `PATCH`  | `/subforums/:name`                        | Editar la descripción de un subforo                          |
| **Posts**       | `GET`    | `/subforums/:name/posts`                  | Listar posts de un subforo (con filtros, orden y paginación) |
| **Posts**       | `POST`   | `/subforums/:name/posts`                  | Crear un post dentro de un subforo                           |
| **Posts**       | `GET`    | `/subforums/:name/posts/:postId`          | Ver el detalle de un post                                    |
| **Posts**       | `PATCH`  | `/subforums/:name/posts/:postId`          | Editar parcialmente un post                                  |
| **Posts**       | `DELETE` | `/subforums/:name/posts/:postId`          | Eliminar un post (y sus comentarios)                         |
| **Reacciones**  | `POST`   | `/subforums/:name/posts/:postId/like`     | Sumar `+1` like a un post                                    |
| **Reacciones**  | `POST`   | `/subforums/:name/posts/:postId/dislike`  | Sumar `+1` dislike a un post                                 |
| **Comentarios** | `GET`    | `/subforums/:name/posts/:postId/comments` | Obtener todos los comentarios de un post (sin paginación)    |
| **Comentarios** | `POST`   | `/subforums/:name/posts/:postId/comments` | Publicar un comentario en un post                            |

---

## 3. Modelos de datos

### Subforum (Subforo)

| Campo            | Tipo     | Descripción                                                                                                                                                    |
| :--------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | `string` | Identificador único en la URL. Solo letras minúsculas, números y guiones (`a-z`, `0-9`, `-`), de 3 a 40 caracteres, sin espacios. Ejemplo: `programacion-web`. |
| `description`    | `string` | Descripción en texto plano del tema del subforo (máximo 300 caracteres).                                                                                       |
| `postCount`      | `number` | Cantidad total de posts publicados actualmente en este subforo.                                                                                                |
| `createdAt`      | `string` | Fecha y hora de creación (ISO 8601 UTC).                                                                                                                       |
| `lastActivityAt` | `string` | Fecha de la actividad más reciente en el subforo (último post o último comentario; si aún no tiene posts, coincide con `createdAt`).                           |

### Post (Publicación)

| Campo          | Tipo             | Descripción                                                                                         |
| :------------- | :--------------- | :-------------------------------------------------------------------------------------------------- |
| `id`           | `number`         | Identificador numérico único del post.                                                              |
| `subforum`     | `string`         | `name` del subforo al que pertenece.                                                                |
| `title`        | `string`         | Título de la publicación (obligatorio, 1 a 150 caracteres).                                         |
| `content`      | `string`         | Texto principal de la publicación (obligatorio, 1 a 5000 caracteres).                               |
| `author`       | `string`         | Nombre libre de quien publica. (obligatorio, 1 a 50 caracteres).                                    |
| `imageUrl`     | `string \| null` | URL externa de una imagen (`http://` o `https://`). Si el post no tiene imagen, su valor es `null`. |
| `likes`        | `number`         | Contador de likes (inicia en `0`).                                                                  |
| `dislikes`     | `number`         | Contador de dislikes (inicia en `0`).                                                               |
| `commentCount` | `number`         | Cantidad de comentarios asociados al post (inicia en `0`).                                          |
| `createdAt`    | `string`         | Fecha y hora de publicación (ISO 8601 UTC).                                                         |
| `updatedAt`    | `string`         | Fecha y hora de la última edición (ISO 8601 UTC).                                                   |

> **Regla visual recomendada para el frontend:** Al mostrar un post en pantalla, coloca siempre primero el **título**, debajo el **contenido en texto** y al final la **imagen** (si `imageUrl` no es `null`). Como las imágenes provienen de enlaces externos, recuerda manejar el evento de error de carga en `<img>` por si el enlace deja de funcionar.

### Comment (Comentario)

| Campo       | Tipo     | Descripción                                                     |
| :---------- | :------- | :-------------------------------------------------------------- |
| `id`        | `number` | Identificador numérico único del comentario.                    |
| `postId`    | `number` | `id` del post al que pertenece.                                 |
| `author`    | `string` | Nombre libre de quien comenta (obligatorio, 1 a 50 caracteres). |
| `content`   | `string` | Texto del comentario (obligatorio, 1 a 1500 caracteres).        |
| `createdAt` | `string` | Fecha y hora de publicación (ISO 8601 UTC).                     |

---

## 4. Endpoints de Subforos

### 4.1 Listar subforos

```http
GET /subforums
```

Devuelve la lista paginada de subforos existentes junto con su cantidad de posts y su última actividad.

#### Parámetros de consulta (Query Params)

| Parámetro | Tipo     | Obligatorio | Valor por defecto | Valores permitidos / Descripción                                       |
| :-------- | :------- | :---------- | :---------------- | :--------------------------------------------------------------------- |
| `page`    | `number` | No          | `1`               | Número de página (entero mayor o igual a `1`).                         |
| `limit`   | `number` | No          | `10`              | Cantidad de subforos por página (`1` a `50`).                          |
| `sortBy`  | `string` | No          | `lastActivity`    | `lastActivity` (última actividad) o `postCount` (número de posts).     |
| `order`   | `string` | No          | `desc`            | `desc` (mayor a menor / más reciente primero) o `asc` (menor a mayor). |

#### Ejemplo de petición

```http
GET /api/subforums?page=1&limit=10&sortBy=postCount&order=desc
```

#### Respuesta exitosa (`200 OK`)

```json
{
  "data": [
    {
      "name": "programacion",
      "description": "Dudas, proyectos y recursos sobre programación y desarrollo de software.",
      "postCount": 14,
      "createdAt": "2026-11-10T15:00:00Z",
      "lastActivityAt": "2026-11-18T18:45:12Z"
    },
    {
      "name": "videojuegos",
      "description": "Recomendaciones, reseñas y noticias de videojuegos.",
      "postCount": 7,
      "createdAt": "2026-11-12T20:10:00Z",
      "lastActivityAt": "2026-11-17T22:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 4.2 Crear un subforo

```http
POST /subforums
```

Crea un nuevo subforo. El campo `name` debe ser único y seguir el formato de identificador para URL (sin espacios ni acentos).

#### Cuerpo de la petición (JSON)

| Campo         | Tipo     | Obligatorio | Reglas                                    |
| :------------ | :------- | :---------- | :---------------------------------------- |
| `name`        | `string` | Sí          | 3–40 caracteres. Solo `a-z`, `0-9` y `-`. |
| `description` | `string` | Sí          | 1–300 caracteres.                         |

#### Ejemplo de petición

```json
{
  "name": "musica-indie",
  "description": "Espacio para compartir bandas, álbumes y conciertos independientes."
}
```

#### Respuesta exitosa (`201 Created`)

```json
{
  "name": "musica-indie",
  "description": "Espacio para compartir bandas, álbumes y conciertos independientes.",
  "postCount": 0,
  "createdAt": "2026-11-18T19:35:00Z",
  "lastActivityAt": "2026-11-18T19:35:00Z"
}
```

#### Errores posibles

- `400 Bad Request`: El `name` contiene caracteres inválidos o falta `description`.
- `409 Conflict`: Ya existe un subforo con ese `name`.

---

### 4.3 Obtener un subforo por nombre

```http
GET /subforums/:name
```

Devuelve la información detallada de un solo subforo.

#### Respuesta exitosa (`200 OK`)

```json
{
  "name": "programacion",
  "description": "Dudas, proyectos y recursos sobre programación y desarrollo de software.",
  "postCount": 14,
  "createdAt": "2026-11-10T15:00:00Z",
  "lastActivityAt": "2026-11-18T18:45:12Z"
}
```

#### Errores posibles

- `404 Not Found`: No existe ningún subforo con ese `name`.

---

### 4.4 Editar la descripción de un subforo

```http
PATCH /subforums/:name
```

Permite actualizar únicamente la descripción del subforo. El `name` no se puede cambiar y los subforos no pueden eliminarse.

#### Cuerpo de la petición (JSON)

```json
{
  "description": "Dudas de Java, React, bases de datos y proyectos de la clase."
}
```

#### Respuesta exitosa (`200 OK`)

Devuelve el objeto del subforo actualizado.

#### Errores posibles

- `400 Bad Request`: `description` vacía o mayor a 300 caracteres.
- `404 Not Found`: El subforo no existe.

---

## 5. Endpoints de Posts

### 5.1 Listar posts de un subforo (o feed general)

```http
GET /subforums/:name/posts
```

> **Nota:** Estos endpoints devuelven solo el contador `commentCount` en cada post, **no** el arreglo de comentarios. Para ver los comentarios de un post debes llamar a `GET /subforums/:name/posts/:postId/comments`.

#### Parámetros de consulta (Query Params)

| Parámetro    | Tipo      | Obligatorio | Valor por defecto | Valores permitidos / Descripción                                                                                                                                                                          |
| :----------- | :-------- | :---------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`       | `number`  | No          | `1`               | Número de página (entero `>= 1`).                                                                                                                                                                         |
| `limit`      | `number`  | No          | `10`              | Cantidad de posts por página (`1` a `50`).                                                                                                                                                                |
| `afterDate`  | `string`  | No          | —                 | Fecha mínima inclusiva (`YYYY-MM-DD` o ISO 8601). Si envías solo fecha (`2026-11-01`), incluye desde las `00:00:00Z`.                                                                                     |
| `beforeDate` | `string`  | No          | —                 | Fecha máxima inclusiva (`YYYY-MM-DD` o ISO 8601). Si envías solo fecha (`2026-11-18`), incluye hasta las `23:59:59Z`.                                                                                     |
| `hasImage`   | `boolean` | No          | —                 | `true` para mostrar solo posts con imagen; `false` para mostrar solo posts sin imagen. Si se omite, devuelve ambos.                                                                                       |
| `sortBy`     | `string`  | No          | `date`            | Criterio de ordenamiento: `date` (fecha de creación), `author` (nombre de autor A–Z), `contentLength` (cantidad de caracteres de `content`), `likes` (número de likes) o `dislikes` (número de dislikes). |
| `order`      | `string`  | No          | `desc`            | `desc` o `asc`.                                                                                                                                                                                           |

#### Ejemplo de petición

```http
GET /api/subforums/programacion/posts?afterDate=2026-11-01&beforeDate=2026-11-18&hasImage=true&sortBy=likes&order=desc&page=1&limit=10
```

#### Respuesta exitosa (`200 OK`)

```json
{
  "data": [
    {
      "id": 42,
      "subforum": "programacion",
      "title": "Diagrama rápido del ciclo de vida en React",
      "content": "Les comparto este esquema que me ayudó a entender cuándo se ejecuta useEffect.",
      "author": "AnaG",
      "imageUrl": "https://ejemplo.com/imagenes/react-ciclo.png",
      "likes": 12,
      "dislikes": 1,
      "commentCount": 3,
      "createdAt": "2026-11-15T16:20:00Z",
      "updatedAt": "2026-11-15T16:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Errores posibles

- `400 Bad Request`: Formato de fecha inválido en `afterDate`/`beforeDate`, valor no reconocido en `sortBy`/`order`, o `afterDate` posterior a `beforeDate`.
- `404 Not Found`: El subforo `:name` no existe (en la ruta `/subforums/:name/posts`).

---

### 5.2 Crear un post en un subforo

```http
POST /subforums/:name/posts
```

Publica un nuevo post dentro del subforo `:name`.

#### Cuerpo de la petición (JSON)

| Campo      | Tipo             | Obligatorio | Reglas                                                                                          |
| :--------- | :--------------- | :---------- | :---------------------------------------------------------------------------------------------- |
| `title`    | `string`         | Sí          | 1–150 caracteres.                                                                               |
| `content`  | `string`         | Sí          | 1–5000 caracteres.                                                                              |
| `author`   | `string`         | Sí          | 1–50 caracteres (texto libre).                                                                  |
| `imageUrl` | `string \| null` | No          | URL válida que inicie con `http://` o `https://`. Si se omite o es `""`, se guarda como `null`. |

#### Ejemplo de petición

```json
{
  "title": "¿Cómo evitar que useEffect se ejecute en bucle?",
  "content": "Estoy haciendo un fetch dentro de useEffect pero mi componente vuelve a pedir los datos sin parar.",
  "author": "CarlosM",
  "imageUrl": null
}
```

#### Respuesta exitosa (`201 Created`)

```json
{
  "id": 43,
  "subforum": "programacion",
  "title": "¿Cómo evitar que useEffect se ejecute en bucle?",
  "content": "Estoy haciendo un fetch dentro de useEffect pero mi componente vuelve a pedir los datos sin parar.",
  "author": "CarlosM",
  "imageUrl": null,
  "likes": 0,
  "dislikes": 0,
  "commentCount": 0,
  "createdAt": "2026-11-18T19:40:00Z",
  "updatedAt": "2026-11-18T19:40:00Z"
}
```

#### Errores posibles

- `400 Bad Request`: Falta un campo obligatorio o `imageUrl` no tiene formato de URL válida.
- `404 Not Found`: El subforo `:name` no existe.

---

### 5.3 Obtener el detalle de un post

```http
GET /subforums/:name/posts/:postId
```

Devuelve los datos completos de un post individual (incluyendo `commentCount`, sin el arreglo de comentarios).

#### Respuesta exitosa (`200 OK`)

Devuelve el objeto `Post` completo.

#### Errores posibles

- `404 Not Found`: El subforo no existe o el post no existe dentro de ese subforo.

---

### 5.4 Editar parcialmente un post

```http
PATCH /subforums/:name/posts/:postId
```

Modifica únicamente los campos enviados en el cuerpo de la petición. Los campos que no envíes conservan su valor actual.

#### Campos editables

| Campo      | Tipo             | Descripción                                                 |
| :--------- | :--------------- | :---------------------------------------------------------- |
| `title`    | `string`         | Nuevo título (1–150 caracteres).                            |
| `content`  | `string`         | Nuevo contenido en texto (1–5000 caracteres).               |
| `imageUrl` | `string \| null` | Nueva URL de imagen, o `null` para quitar la imagen actual. |

> **Campos protegidos:** No se pueden modificar `author`, `subforum`, `likes`, `dislikes`, `commentCount`, `createdAt` ni los comentarios desde este endpoint. Si se envían en el cuerpo, el servidor los rechazará (`400 Bad Request`).

#### Ejemplo de petición (editando solo el texto y quitando la imagen)

```json
{
  "content": "Ya lo resolví: me faltaba pasar el arreglo de dependencias vacío [] en useEffect.",
  "imageUrl": null
}
```

#### Respuesta exitosa (`200 OK`)

Devuelve el objeto `Post` completo con el campo `updatedAt` actualizado.

#### Errores posibles

- `400 Bad Request`: Cuerpo vacío (sin ningún campo editable), formato inválido o intento de modificar campos protegidos.
- `404 Not Found`: El subforo o el post no existen.

---

### 5.5 Eliminar un post

```http
DELETE /subforums/:name/posts/:postId
```

Elimina permanentemente el post indicado junto con todos sus comentarios. También descuenta `1` del contador `postCount` del subforo.

#### Respuesta exitosa (`204 No Content`)

No devuelve cuerpo JSON.

#### Errores posibles

- `404 Not Found`: El subforo o el post no existen.

---

## 6. Endpoints de Likes y Dislikes

Como no hay usuarios registrados, cada llamada suma `+1` directamente al contador correspondiente y devuelve los contadores actualizados. No requieren cuerpo JSON.

### 6.1 Dar like a un post

```http
POST /subforums/:name/posts/:postId/like
```

#### Respuesta exitosa (`200 OK`)

```json
{
  "id": 42,
  "likes": 13,
  "dislikes": 1
}
```

### 6.2 Dar dislike a un post

```http
POST /subforums/:name/posts/:postId/dislike
```

#### Respuesta exitosa (`200 OK`)

```json
{
  "id": 42,
  "likes": 13,
  "dislikes": 2
}
```

#### Errores posibles (ambos endpoints)

- `404 Not Found`: El subforo o el post no existen.

---

## 7. Endpoints de Comentarios

Los comentarios son inmutables: una vez publicados **no se pueden editar ni eliminar**.

### 7.1 Obtener todos los comentarios de un post

```http
GET /subforums/:name/posts/:postId/comments
```

Devuelve un **arreglo JSON directo** (sin paginación) con todos los comentarios del post, ordenados cronológicamente del más antiguo al más reciente. Si el post aún no tiene comentarios, devuelve un arreglo vacío `[]`.

#### Respuesta exitosa (`200 OK`)

```json
[
  {
    "id": 101,
    "postId": 43,
    "author": "SofiaDev",
    "content": "Revisa el segundo argumento de useEffect, probablemente olvidaste poner [].",
    "createdAt": "2026-11-18T19:45:00Z"
  },
  {
    "id": 102,
    "postId": 43,
    "author": "CarlosM",
    "content": "¡Era justo eso! Muchas gracias.",
    "createdAt": "2026-11-18T19:48:30Z"
  }
]
```

#### Errores posibles

- `404 Not Found`: El subforo o el post no existen.

---

### 7.2 Publicar un comentario en un post

```http
POST /subforums/:name/posts/:postId/comments
```

Agrega un comentario al post, incrementa en `1` su `commentCount` y actualiza la fecha `lastActivityAt` del subforo.

#### Cuerpo de la petición (JSON)

| Campo     | Tipo     | Obligatorio | Reglas                         |
| :-------- | :------- | :---------- | :----------------------------- |
| `author`  | `string` | Sí          | 1–50 caracteres (texto libre). |
| `content` | `string` | Sí          | 1–1500 caracteres.             |

#### Ejemplo de petición

```json
{
  "author": "SofiaDev",
  "content": "Revisa el segundo argumento de useEffect, probablemente olvidaste poner []."
}
```

#### Respuesta exitosa (`201 Created`)

```json
{
  "id": 101,
  "postId": 43,
  "author": "SofiaDev",
  "content": "Revisa el segundo argumento de useEffect, probablemente olvidaste poner [].",
  "createdAt": "2026-11-18T19:45:00Z"
}
```

#### Errores posibles

- `400 Bad Request`: Falta `author` o `content`, o exceden la longitud permitida.
- `404 Not Found`: El subforo o el post no existen.

---

## 8. Guía rápida de consumo con JavaScript (`fetch`)

Estos ejemplos muestran los patrones básicos que usarás en tu frontend.

### Listar posts con filtros y paginación usando `URLSearchParams`

```javascript
const API_URL = "https://[URL_DEL_SERVIDOR]/api";

async function obtenerPosts(subforum, filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.page) params.append("page", filtros.page);
  if (filtros.limit) params.append("limit", filtros.limit);
  if (filtros.afterDate) params.append("afterDate", filtros.afterDate);
  if (filtros.beforeDate) params.append("beforeDate", filtros.beforeDate);
  if (filtros.hasImage !== undefined)
    params.append("hasImage", filtros.hasImage);
  if (filtros.sortBy) params.append("sortBy", filtros.sortBy);
  if (filtros.order) params.append("order", filtros.order);

  const response = await fetch(
    `${API_URL}/subforums/${subforum}/posts?${params}`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Error al cargar los posts");
  }

  return data; // { data: [...], pagination: { ... } }
}
```

### Crear un nuevo post

```javascript
async function crearPost(subforum, nuevoPost) {
  const response = await fetch(`${API_URL}/subforums/${subforum}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nuevoPost),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "No se pudo crear el post");
  }

  return data;
}
```

### Editar solo el contenido de un post (`PATCH`)

```javascript
async function editarPost(subforum, postId, cambios) {
  const response = await fetch(
    `${API_URL}/subforums/${subforum}/posts/${postId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cambios), // Ej: { title: "Nuevo título" }
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "No se pudo editar el post");
  }

  return data;
}
```

### Consejos para evitar errores comunes

1. **Verifica siempre `response.ok`:** `fetch` no lanza excepción automáticamente ante un `400` o `404`; debes revisar `if (!response.ok)` antes de asumir que todo salió bien.
2. **No olvides `Content-Type: application/json`:** Sin este encabezado en `POST` y `PATCH`, el servidor no interpretará el cuerpo de tu petición.
3. **No hagas `response.json()` en un `DELETE`:** Como `DELETE` devuelve `204 No Content`, intentar leer JSON fallará con un error de sintaxis.
4. **Maneja enlaces de imagen rotos:** Si un post trae `imageUrl`, agrega un manejador `onError` en tu etiqueta `<img>` para mostrar un mensaje discreto o esconder la imagen rota sin romper el diseño.
