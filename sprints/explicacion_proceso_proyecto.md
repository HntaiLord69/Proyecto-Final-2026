# Guía del Proyecto Final 2026 — Foro LCC-chan

**Fecha:** 24 de noviembre de 2026  
**Stack Tecnológico:** React 19 + Vite 8 + JavaScript (ES Modules)  
**Ramas del Repositorio:** `main` (rama principal, sin tocar por ahora), `carlos` y `Joules` (ramas de desarrollo)

---

## 1. Estado Actual del Proyecto (¿Qué llevamos hasta el momento?)

Actualmente el proyecto se encuentra en su **fase de inicialización y definición de arquitectura**. Ya se cuenta con el repositorio Git configurado, las ramas de trabajo creadas, la plantilla base de **React + Vite con JavaScript** instalada y la especificación oficial de la API (`LCC-chan_api_documentacion (1).md`).

### 1.1. Estructura actual de carpetas y archivos

```text
Proyecto-Final-2026/
├── LCC-chan_api_documentacion (1).md   # Especificación completa de la API REST del foro
├── sprints/                            # Carpeta para documentación de avances y sprints
│   ├── explicacion_proceso_proyecto.md
│   └── explicacion_proceso_proyecto.pdf
└── proyecto-final-2026/                # Aplicación Frontend (Vite + React + JS)
    ├── index.html                      # Punto de entrada HTML
    ├── package.json                    # Dependencias y scripts (dev, build, lint, preview)
    ├── package-lock.json               # Bloqueo de versiones de dependencias
    ├── vite.config.js                  # Configuración de Vite con @vitejs/plugin-react
    ├── public/                         # Archivos estáticos públicos (favicon.svg, icons.svg)
    └── src/                            # Código fuente de React
        ├── main.jsx                    # Renderizado raíz de React en #root
        ├── App.jsx                     # Componente principal (actualmente con plantilla base de Vite)
        ├── App.css                     # Estilos del componente App
        ├── index.css                   # Estilos globales
        └── assets/                     # Recursos gráficos (hero.png, react.svg, vite.svg)
```

### 1.2. Tecnologías y Scripts Configurados (`proyecto-final-2026/package.json`)

- **Framework UI:** React `^19.3.1` y React DOM `^19.3.1`
- **Bundler / Entorno de desarrollo:** Vite `^8.3.6` con `@vitejs/plugin-react`
- **Linter:** `oxlint` `^1.90.0`
- **Comandos para ejecutar el proyecto** (dentro de la carpeta `proyecto-final-2026/`):
  - `npm install`: Instala las dependencias locales (`node_modules`).
  - `npm run dev`: Levanta el servidor de desarrollo con recarga en caliente (HMR).
  - `npm run build`: Compila la aplicación optimizada para producción.
  - `npm run lint`: Analiza el código en busca de errores de sintaxis o estilo.

### 1.3. Historial de Git y Estado de las Ramas

Hasta este momento, el repositorio cuenta con tres ramas locales y remotas (`origin`):
1. **`main`**: Rama principal. Tiene el commit inicial (`fba5a50`), la integración del framework Vite + React (`907d962`) y el archivo de documentación de la API (`d29ac40`). **Por acuerdo del equipo, en `main` no se realizarán cambios directos de momento.**
2. **`carlos`**: Rama de trabajo de Carlos (apunta al commit `907d962 - Framework Agregado`).
3. **`Joules`**: Rama de trabajo de Joules (apunta al commit `907d962 - Framework Agregado`).

---

## 2. Explicación de la Especificación de la API (`LCC-chan`)

El proyecto consiste en desarrollar el **Frontend en React** para **LCC-chan**, una plataforma de foros de discusión estilo Reddit simplificado que se comunica con un servidor Backend vía API REST en formato **JSON (`UTF-8`)**.

### 2.1. Reglas Generales del Sistema

1. **Sin cuentas ni autenticación:** No existe inicio de sesión, registro, tokens ni contraseñas. Cualquier usuario puede crear subforos, publicar posts escribiendo libremente su nombre en el campo `author`, comentar y dar *like* o *dislike*.
2. **URL Base:** Todas las peticiones se hacen hacia `https://[URL_DEL_SERVIDOR]/api`.
3. **Encabezado obligatorio en `POST` y `PATCH`:**
   ```http
   Content-Type: application/json
   ```
4. **Fechas en formato ISO 8601 (UTC):** Ejemplo: `2026-11-18T19:30:00Z`. En React/JavaScript se pueden mostrar de forma legible con `new Date(fecha).toLocaleString()`.

### 2.2. Reglas de Negocio por Entidad

| Entidad | ¿Se puede crear? | ¿Se puede editar? | ¿Se puede eliminar? | Reglas clave |
| :--- | :---: | :---: | :---: | :--- |
| **Subforos (`Subforum`)** | Sí (`POST`) | Solo `description` (`PATCH`) | **No** | Identificados por `name` único en la URL (`a-z`, `0-9`, `-`, 3 a 40 caracteres, sin espacios). `description` de 1 a 300 caracteres. |
| **Posts (`Post`)** | Sí (`POST`) | Sí: `title`, `content`, `imageUrl` (`PATCH`) | **Sí** (`DELETE`) | Pertenecen a un subforo. `title` (1–150 chars), `content` (1–5000 chars), `author` (1–50 chars) e `imageUrl` opcional (`http/https` o `null`). |
| **Comentarios (`Comment`)** | Sí (`POST`) | **No** | **No** | Son inmutables una vez publicados. `author` (1–50 chars) y `content` (1–1500 chars). Se consultan en un endpoint separado. |
| **Likes / Dislikes** | Sí (`POST`) | — | — | Cada petición suma `+1` al contador correspondiente (`likes` o `dislikes`). No llevan cuerpo JSON. |

### 2.3. Mapa Completo de Endpoints a Consumir

#### A. Módulo de Subforos
- **`GET /subforums`**: Lista paginada de subforos. Acepta query params: `page` (default `1`), `limit` (`1`–`50`, default `10`), `sortBy` (`lastActivity` o `postCount`) y `order` (`desc` o `asc`).
- **`POST /subforums`**: Crea un subforo enviando `{ "name": "...", "description": "..." }`. Devuelve `201 Created` (o `409 Conflict` si el nombre ya existe).
- **`GET /subforums/:name`**: Obtiene la información de un subforo específico (`name`, `description`, `postCount`, `createdAt`, `lastActivityAt`).
- **`PATCH /subforums/:name`**: Actualiza únicamente la descripción enviando `{ "description": "..." }`.

#### B. Módulo de Posts
- **`GET /subforums/:name/posts`**: Lista paginada de posts de un subforo. Permite filtrar y ordenar mediante query params:
  - Paginación: `page`, `limit`
  - Filtros de fecha: `afterDate` (`YYYY-MM-DD` o ISO), `beforeDate` (`YYYY-MM-DD` o ISO)
  - Filtro multimedia: `hasImage` (`true` o `false`)
  - Ordenamiento: `sortBy` (`date`, `author`, `contentLength`, `likes`, `dislikes`) y `order` (`desc` o `asc`)
- **`POST /subforums/:name/posts`**: Crea un post en el subforo `:name` enviando `{ "title", "content", "author", "imageUrl" }`.
- **`GET /subforums/:name/posts/:postId`**: Obtiene el detalle de un post específico (incluye `commentCount`, pero no el arreglo de comentarios).
- **`PATCH /subforums/:name/posts/:postId`**: Edita parcialmente un post (`title`, `content` y/o `imageUrl`). **Importante:** No enviar campos protegidos como `author` o `likes` porque el servidor responderá `400 Bad Request`.
- **`DELETE /subforums/:name/posts/:postId`**: Elimina el post y sus comentarios. Responde `204 No Content` (sin cuerpo JSON).

#### C. Módulo de Reacciones (Likes y Dislikes)
- **`POST /subforums/:name/posts/:postId/like`**: Suma `+1` like y devuelve `{ id, likes, dislikes }`.
- **`POST /subforums/:name/posts/:postId/dislike`**: Suma `+1` dislike y devuelve `{ id, likes, dislikes }`.

#### D. Módulo de Comentarios
- **`GET /subforums/:name/posts/:postId/comments`**: Devuelve un arreglo directo `[...]` (sin paginación) con todos los comentarios del post en orden cronológico.
- **`POST /subforums/:name/posts/:postId/comments`**: Publica un comentario enviando `{ "author", "content" }`.

### 2.4. Consideraciones Críticas para el Desarrollo en React

1. **Orden visual obligatorio de los Posts:** Según la especificación, al renderizar un post siempre debe mostrarse:
   1. Primero el **Título** (`title`)
   2. Debajo el **Contenido en texto** (`content`)
   3. Al final la **Imagen** (`imageUrl`, solo si no es `null`), agregando un manejador `onError` en la etiqueta `<img>` por si el enlace externo falla.
2. **Estructura de Paginación:** Los listados de subforos y posts devuelven `{ data: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`. Los valores `hasPrev` y `hasNext` sirven directamente para habilitar/deshabilitar los botones de "Anterior" y "Siguiente".
3. **Cuidado con `DELETE` (`204 No Content`):** Al eliminar un post, **no** se debe ejecutar `await response.json()` porque la respuesta viene vacía y lanzará un error de sintaxis.
4. **Manejo de errores de la API:** Verificar siempre `if (!response.ok)` y mostrar al usuario el mensaje que viene en `data.error.message` o los detalles por campo en `data.error.details`.

---

## 3. Guía Paso a Paso: Cómo trabajar con Git, Commit y Push en las Ramas (`carlos` y `Joules`)

Recuerda la regla principal en esta etapa: **No trabajar directamente sobre la rama `main`**. Todo el desarrollo se hace en las ramas **`carlos`** y **`Joules`**.

### Paso 1: Abrir la terminal en la raíz del repositorio y verificar tu rama actual

Ubícate en la carpeta raíz del repositorio (`Proyecto-Final-2026`) y revisa en qué rama te encuentras:

```bash
cd ~/Documents/Proyecto-Final-2026
git status
git branch
```
*(La rama que tiene un asterisco `*`, por ejemplo `* main`, es la rama en la que estás parado actualmente).*

---

### Paso 2: Cambiarte a tu rama de trabajo (`carlos` o `Joules`)

Antes de programar o guardar cambios, cámbiate a tu rama correspondiente:

- **Si eres Carlos:**
  ```bash
  git checkout carlos
  ```
  *(o bien `git switch carlos`)*

- **Si eres Joules:**
  ```bash
  git checkout Joules
  ```
  *(o bien `git switch Joules`)*

> **Nota útil:** Como el archivo `LCC-chan_api_documentacion (1).md` fue subido en `main`, si al cambiarte a tu rama `carlos` o `Joules` quieres traer ese archivo de documentación a tu rama, puedes ejecutar una sola vez:
> ```bash
> git merge main
> ```

---

### Paso 3: Descargar posibles cambios remotos de tu rama (Antes de empezar a trabajar)

Si trabajas desde otra computadora o quieres asegurarte de tener tu rama actualizada con GitHub:

- **Para Carlos:**
  ```bash
  git pull origin carlos
  ```
- **Para Joules:**
  ```bash
  git pull origin Joules
  ```

---

### Paso 4: Revisar qué archivos modificaste o creaste

Una vez que hayas avanzado en el código dentro de `proyecto-final-2026/src/` o en `sprints/`, revisa qué archivos detecta Git:

```bash
git status
```
- Los archivos en **rojo** son cambios que aún no están preparados (*unstaged*).
- Los archivos en **verde** ya están listos para guardarse en un commit (*staged*).

---

### Paso 5: Agregar tus archivos al área de preparación (`git add`)

Puedes agregar todos los archivos modificados de una vez o elegir archivos específicos:

- **Opción A — Agregar todos los cambios realizados:**
  ```bash
  git add .
  ```
- **Opción B — Agregar solo un archivo o carpeta específica (recomendado para commits ordenados):**
  ```bash
  git add proyecto-final-2026/src/App.jsx
  # o por ejemplo la carpeta sprints:
  git add sprints/
  ```

Verifica nuevamente con `git status` que los archivos que deseas subir aparezcan en color **verde**.

---

### Paso 6: Crear el Commit (`git commit`)

Guarda tus cambios en el historial local de tu rama con un mensaje claro que explique qué hiciste:

```bash
git commit -m "feat: explicación breve de lo que se agregó o modificó"
```

**Ejemplos de buenos mensajes de commit:**
- `git commit -m "docs: agregar documento de explicacion del proyecto en sprints"`
- `git commit -m "feat: crear servicio de consumo de API para subforos"`
- `git commit -m "feat: implementar componente de listado de posts con filtros"`

---

### Paso 7: Subir los cambios a GitHub (`git push`)

Finalmente, envía tus commits locales a tu rama correspondiente en el repositorio remoto (`origin`), **nunca a `main` de momento**:

- **Si estás en la rama de Carlos:**
  ```bash
  git push origin carlos
  ```

- **Si estás en la rama de Joules:**
  ```bash
  git push origin Joules
  ```

---

### Resumen Rápido de Comandos (Chuleta / Cheat Sheet)

| Acción | Comando para **Carlos** | Comando para **Joules** |
| :--- | :--- | :--- |
| **1. Ir a tu rama** | `git checkout carlos` | `git checkout Joules` |
| **2. Actualizar tu rama** | `git pull origin carlos` | `git pull origin Joules` |
| **3. Ver estado de archivos** | `git status` | `git status` |
| **4. Preparar cambios** | `git add .` | `git add .` |
| **5. Guardar commit** | `git commit -m "mensaje"` | `git commit -m "mensaje"` |
| **6. Subir a GitHub** | `git push origin carlos` | `git push origin Joules` |
