# Ventus Sales

Aplicación web para crear pedidos en SAP



## How to use

npm install

npm run dev

## Prisma picking schema quickstart

1. Cambia temporalmente `DATABASE_URL` a la credencial con permisos de edición de esquema.
2. Ejecuta el push del esquema de picking (sin data-loss porque usa `db push`):
   ```bash
   DATABASE_URL="mysql://usuario:clave@host:puerto/db" npx prisma db push
   ```
3. Genera el cliente tipado apuntando a la misma credencial con permisos de edición:
   ```bash
   DATABASE_URL="mysql://usuario:clave@host:puerto/db" npx prisma generate
   ```
4. Restablece tu `DATABASE_URL` habitual (solo lectura o menos privilegios) para el desarrollo normal.
5. Si trabajas en equipo, haz `git pull` después de restaurar la clave para evitar conflictos de lock de Prisma.

> Nota: no incluyas credenciales en commits ni en `.env.example`.

## Archivos del flujo de picking a confirmar en los merges
Si en tu rama hubo conflictos o solo se subieron algunos archivos, revisa que todos estos estén presentes para que el módulo de picking funcione completo:

- `pages/picking.tsx`: dashboard y formulario principal de picking con captura de fotos.
- `pages/api/picking/search.ts`: búsqueda directa a SAP y fusión con pickings existentes.
- `pages/api/picking/index.ts`: creación de pickings y líneas a partir de resultados SAP.
- `pages/api/picking/photo.ts`: registro de fotos (usando URLs ya subidas al bucket S3 existente).
- `pages/api/picking/status.ts`: cambios de estado de pedido/línea.
- `lib/prisma.ts`: helper del cliente Prisma compartido.
- `prisma/schema.prisma`: modelos `pickings`, `picking_lines` y `picking_photos`.

Si falta alguno de estos archivos tras un merge, repite el merge o cherry-pick para recuperarlos antes de probar el flujo.
