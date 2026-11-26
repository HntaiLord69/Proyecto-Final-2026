# LCC-chan — Foro Comunitario UNISON (Proyecto Final 2026)

Plataforma de discusión comunitaria estilo Reddit con diseño **Glassmorphism Pro** desarrollada para la **Licenciatura en Ciencias de la Computación (LCC)** de la **Universidad de Sonora (UNISON)**.

- **Portal Oficial LCC:** https://cc.unison.mx/
- **Portal General UNISON:** https://www.unison.mx/
- **Servidor Backend API REST:** `https://157.245.161.37/api`

---

## Características Principales

- **100% Conectado a la API REST (`LCC-chan`):**
  - **Subforos (`Subforum`):** Listado paginado (`page`, `limit`, `sortBy`, `order`), creación (`POST /subforums`), consulta individual (`GET /subforums/:name`) y edición de descripción (`PATCH /subforums/:name`).
  - **Publicaciones (`Post`):** Listado con filtros completos (`page`, `limit`, `afterDate`, `beforeDate`, `hasImage`, `sortBy`, `order`), creación (`POST`), consulta (`GET`), edición parcial sin campos protegidos (`PATCH`) y eliminación (`DELETE` con manejo de `204 No Content`).
  - **Reacciones (`Likes / Dislikes`):** `POST .../like` y `POST .../dislike` con partículas animadas (*Spark Burst*).
  - **Comentarios (`Comment`):** Consulta cronológica (`GET .../comments`) y publicación inmutable (`POST .../comments`) con insignia `OP` y respuesta rápida (`↩ Responder`).
- **Experiencia Visual e Interactiva:**
  - **10 Paletas de Colores Glassmorphic** (incluyendo *LCC UNISON*, *Tokyo Night*, *Reddit Dark*, *Gruvbox*, *Catppuccin*, *Dracula Pro*, *Nord Polar* y *Cyberpunk 84*).
  - **Autocompletado en Vivo en la Barra de Búsqueda** para comunidades (`r/subforo`), perfiles de usuario (`u/autor`) y publicaciones con soporte de teclado (`↑↓`, `Tab`, `Enter`).
  - **Páginas de Perfil e Historial de Usuario en 1 Clic (`#/u/:author`)** con cálculo de Karma, rangos académicos (*Búho Legendario*, *Senior Dev LCC*, *Búho Activo*, *Nuevo Búho*) y filtro por comunidad.
  - **Subida de Imágenes Drag & Drop** con conversión automática a enlace externo `https://...` compatible con `imageUrl` del backend.
  - **Vista Previa en Vivo (`✍️ Escribir` | `👁️ Vista Previa`)**, renderizador de bloques de código con botón de copiado, Carrusel de Tendencias y Paleta de Comandos (`Ctrl + K`).

---

## Estructura del Repositorio

```text
Proyecto-Final-2026/
├── proyecto-final-2026/        # Aplicación Frontend (React 19 + Vite 8)
│   ├── public/                 # Emblemas oficiales PNG transparentes (lcc-logo.png, unison-logo.png)
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, RightRail, Posts, Subforos, Comentarios y UI
│   │   ├── pages/              # HomePage, SubforumPage, PostDetailPage, UserProfilePage
│   │   ├── services/           # Cliente HTTP y servicios REST (subforums, posts, comments)
│   │   ├── styles/             # Variables de las 10 paletas, componentes y animaciones
│   │   └── utils/              # Validadores, fechas ISO 8601, storage y uploader Drag & Drop
│   └── package.json
└── sprints/                    # Documentación técnica paso a paso del proyecto
    ├── documentacion.md
    ├── explicacion_proceso_proyecto.md
    └── explicacion_proceso_proyecto.pdf
```

---

## Instalación y Ejecución

```bash
cd proyecto-final-2026
npm install
npm run dev
```

Para compilar para producción:

```bash
cd proyecto-final-2026
npm run lint
npm run build
```
