import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";

const prisma = new PrismaClient();

const buildUserPayload = (body: any) => {
  const payload: any = {};

  if (body.name !== undefined) payload.name = body.name;
  if (body.email !== undefined) payload.email = body.email;
  if (body.ownerId !== undefined && body.ownerId !== null && body.ownerId !== "") {
    const numericOwnerId = Number(body.ownerId);
    if (!Number.isNaN(numericOwnerId)) payload.ownerId = numericOwnerId;
  }
  if (body.password !== undefined) payload.password = body.password || null;
  if (body.rol !== undefined) payload.rol = body.rol || null;
  if (body.permissions !== undefined) payload.permissions = body.permissions || null;
  if (body.team !== undefined) payload.team = body.team || null;
  if (body.rut !== undefined) payload.rut = body.rut || null;
  if (body.image !== undefined) payload.image = body.image || null;

  return payload;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (req.method === "GET") {
      const [users, roles, permissions] = await Promise.all([
        prisma.users.findMany({ orderBy: { id: "desc" } }),
        prisma.users.groupBy({
          by: ["rol"],
          where: { rol: { not: null } },
          _count: true,
        }),
        prisma.users.groupBy({
          by: ["permissions"],
          where: { permissions: { not: null } },
          _count: true,
        }),
      ]);

      return res.status(200).json({
        users,
        roles: roles.map((item) => item.rol),
        permissions: permissions.map((item) => item.permissions),
      });
    }

    if (req.method === "POST") {
      const payload = buildUserPayload(req.body);

      if (!payload.name || !payload.email || payload.ownerId === undefined) {
        return res.status(400).json({ message: "Nombre, email y ownerId son obligatorios" });
      }

      const user = await prisma.users.create({ data: payload });
      return res.status(201).json({ user });
    }

    if (req.method === "PUT") {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: "El id del usuario es obligatorio" });
      }

      const payload = buildUserPayload(req.body);
      const user = await prisma.users.update({ where: { id: Number(id) }, data: payload });
      return res.status(200).json({ user });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || req.query;
      if (!id) {
        return res.status(400).json({ message: "El id del usuario es obligatorio" });
      }

      await prisma.users.delete({ where: { id: Number(id) } });
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end("Method Not Allowed");
  } catch (error: any) {
    console.error("Error en /api/admin/users:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error?.message });
  } finally {
    await prisma.$disconnect();
  }
}
