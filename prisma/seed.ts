/**
 * Development seed — SYNTHETIC data only (issue #19: "Datos seed únicamente ficticios").
 * Never run against production. Creates a seeded admin and a handful of requests
 * spread across the lifecycle so the admin panel and flows have something to show.
 */
import { PrismaClient } from "@prisma/client";
import { newRequestReference } from "../src/lib/id";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database.");
  }

  await db.adminUser.upsert({
    where: { email: "admin@praetoria.local" },
    update: { passwordHash: await hashPassword("praetoria-dev") },
    create: {
      email: "admin@praetoria.local",
      name: "Admin de pruebas",
      passwordHash: await hashPassword("praetoria-dev"),
      role: "ADMIN",
    },
  });

  const fixtures: {
    status: "PENDIENTE_ANALISIS" | "EN_REVISION" | "PRESUPUESTO_ENVIADO" | "CERRADA";
    trade: string;
    problem: string;
    municipality: string;
    postalCode: string;
  }[] = [
    {
      status: "PENDIENTE_ANALISIS",
      trade: "fontaneria",
      problem: "Sale agua por debajo del fregadero de la cocina y el mueble está mojado.",
      municipality: "Valencia",
      postalCode: "46007",
    },
    {
      status: "EN_REVISION",
      trade: "electricidad",
      problem: "Saltan los plomos cada vez que enciendo el horno y la vitrocerámica a la vez.",
      municipality: "Burjassot",
      postalCode: "46100",
    },
    {
      status: "PRESUPUESTO_ENVIADO",
      trade: "persianas",
      problem: "La persiana del salón no sube, se ha soltado la cinta.",
      municipality: "Godella",
      postalCode: "46110",
    },
    {
      status: "CERRADA",
      trade: "montaje",
      problem: "Necesito montar un armario de tres puertas y colgar dos estanterías.",
      municipality: "Moncada",
      postalCode: "46113",
    },
  ];

  for (const f of fixtures) {
    const reference = newRequestReference();
    await db.request.create({
      data: {
        reference,
        status: f.status,
        trade: f.trade,
        problemText: f.problem,
        municipality: f.municipality,
        postalCode: f.postalCode,
        withinCoverage: true,
        submittedAt: new Date(),
        contact: {
          create: {
            name: "Cliente de pruebas",
            phone: "+34600000000",
            email: "cliente@example.com",
            preferredChannel: "WHATSAPP",
          },
        },
        location: {
          create: { municipality: f.municipality, postalCode: f.postalCode },
        },
        statusHistory: {
          create: { to: f.status, actorType: "SYSTEM", reason: "seed" },
        },
      },
    });
  }

  console.log("Seed complete: 1 admin, %d requests", fixtures.length);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
