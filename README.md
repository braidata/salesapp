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
