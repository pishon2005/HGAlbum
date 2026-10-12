# HGAlbum — Documentación Técnica (Fase 1: Cimientos y Seguridad)

Este documento recopila las decisiones arquitectónicas, modelos de datos, políticas de seguridad y patrones de implementación adoptados durante la **Fase 1**.

---

## 1. Arquitectura: Feature-Sliced Design (FSD)

El código fuente en `src/` sigue estrictamente las capas unidireccionales de FSD:

```
src/
├── app/                  # Providers globales, enrutador y estilos
│   ├── providers/        # AuthProvider, QueryProvider, AuthContext, useAuth
│   ├── routes/           # Rutas basadas en archivos (__root, index, login, register, join, upload, timeline)
│   └── routeTree.gen.ts  # Árbol generado automáticamente por TanStack Router
├── pages/                # Vistas de página ensambladas
│   ├── LoginPage/
│   ├── RegisterPage/
│   ├── JoinPage/
│   ├── UploadPage/
│   └── TimelinePage/
├── features/             # Casos de uso e interacciones de usuario
│   ├── auth/             # Esquemas de validación Zod
│   ├── photo-upload/     # Hook useUploadPhoto, extractor EXIF, tipos de cola
│   └── timeline/         # Hook useTimeline, queries TanStack Query, LightboxModal
├── entities/             # Tipos y esquemas de datos del dominio
│   ├── user/             # Profile
│   ├── couple/           # Couple
│   ├── album/            # Album
│   └── photo/            # Photo, MediaType, Zod schemas
└── shared/               # Utilidades comunes y componentes UI base
    ├── lib/              # Cliente singleton de Supabase
    └── ui/               # ProtectedRoute
```

### Regla de Dependencia Unidireccional
Una capa superior puede importar de una inferior, pero nunca al revés (`pages` importa de `features` y `shared`, pero `shared` no importa de ninguna capa superior).

---

## 2. Decisiones Técnicas Clave

### 2.1. TanStack Router & Rutas FSD
- **Decisión**: Centralizar los archivos de ruta en `src/app/routes/` y el archivo generado en `src/app/routeTree.gen.ts`.
- **Justificación**: Mantiene la estructura canónica de FSD sin romper el file-based routing del plugin `@tanstack/router-plugin/vite`.
- **Separación de responsabilidades**: Los archivos de ruta solo declaran la ruta y montan el componente de la capa `pages/` (ej. `Route = createFileRoute('/upload')({ component: ... })`).

### 2.2. Tailwind CSS v4 con `@theme`
- **Decisión**: Utilizar la sintaxis nativa de Tailwind v4 en `src/index.css` en lugar del archivo de configuración `tailwind.config.js`.
- **Tokens definidos**:
  - `--color-bg-primary`: `#F9FAFB` (Blanco roto)
  - `--color-bg-secondary`: `#F3F4F6` (Gris muy claro)
  - `--color-text-primary`: `#1F2937` (Gris oscuro)
  - `--color-text-secondary`: `#6B7280` (Gris medio)
  - `--color-accent-romantic` / `--color-romantic`: `#F472B6` (Rosa suave)
  - `--color-accent-interactive` / `--color-interactive`: `#818CF8` (Índigo suave)
  - `--color-accent-highlight` / `--color-highlight`: `#FBBF24` (Amarillo dorado)
  - `--color-accent-success` / `--color-success`: `#34D399` (Verde menta)

### 2.3. Autenticación y Fast Refresh (React Compiler Ready)
- **Decisión**: Desacoplar `AuthContext.ts`, `useAuth.ts` y `AuthProvider.tsx`.
- **Justificación**:
  - Cumple la regla `react-refresh/only-export-components` de Vite / ESLint.
  - Mantiene los componentes puros y libres de efectos secundarios ocultos, listos para optimizaciones automáticas de compilador.

### 2.4. Seguridad en Supabase (RLS y Storage Privado)
- **Orden de Migración**: La tabla `couples` se crea antes de `profiles` debido a la clave foránea `couple_id`.
- **Bucket Privado**: El bucket `album-media` está configurado como **privado** (`public = false`). Los archivos se sirven mediante URLs firmadas (`createSignedUrls`) con vigencia controlada de 1 hora.
- **Ruta en Storage**: `{couple_id}/{photo_id}.{extension}`, lo que permite a las políticas RLS validar que el primer segmento de la ruta corresponda al `couple_id` del usuario autenticado:
  ```sql
  (storage.foldername(name))[1] in (
    select couple_id::text from public.profiles where id = auth.uid()
  )
  ```
- **Vinculación Atómica**: Se implementó la función SQL `public.join_couple_by_code(code)` con `security definer` para evitar problemas de recursión de RLS al buscar parejas por código, garantizando además el límite de 2 integrantes por pareja.

### 2.5. Validación con Zod en Frontera de Datos
- **Formularios**: Validación en tiempo real y previo al envío para Login, Registro y Código de Invitación (`src/features/auth/model/schemas.ts`).
- **Respuestas de API**: Validación de la lista de recuerdos recibidos antes de inyectarlos en la UI (`src/entities/photo/model/schemas.ts`).

### 2.6. Extracción EXIF y Edición de Fecha
- **Librería**: `exifr` analiza el buffer del archivo en el navegador para extraer `DateTimeOriginal` o `CreateDate`.
- **Editable**: El valor detectado se precarga en un campo `<input type="datetime-local" />`, permitiendo al usuario corregir o ajustar la fecha antes de confirmar la subida.

### 2.7. Optimización y Caching con TanStack Query
- **`queryOptions()`**: Se usa `timelineQueryOptions` con query key estable `['timeline', coupleId]`.
- **Caché**: 5 minutos de `staleTime` con reintentos controlados para evitar peticiones redundantes.

---

## 3. Estado de los Entregables de la Fase 1

- [x] Proyecto configurado con Vite + React 19 + TypeScript + Tailwind CSS v4 + TanStack Router.
- [x] Cliente de Supabase configurado y conectado con variables de entorno protegidas.
- [x] `AuthProvider` funcional con login, registro, sesión persistente y logout.
- [x] Sistema de invitación por código único para parejas funcionando.
- [x] Tablas creadas en Supabase (`couples`, `profiles`, `albums`, `photos`) con RLS habilitado en todas.
- [x] Bucket de Storage privado `album-media` creado con políticas de lectura y subida por pareja.
- [x] Hook `useUploadPhoto` con extracción EXIF y fecha editable.
- [x] Página de subida funcional con drag & drop y vista previa.
- [x] Timeline básica mostrando las fotos agrupadas por mes y ordenadas por fecha descendente.
- [x] Rutas protegidas (`ProtectedRoute`) redirigiendo a `/login` si no hay sesión.
