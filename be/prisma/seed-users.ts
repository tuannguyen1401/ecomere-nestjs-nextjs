import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // Upsert admin
  await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@admin.com",
      password: adminPassword,
      role: "admin",
    },
  });

  // Upsert user
  await prisma.user.upsert({
    where: { email: "user@user.com" },
    update: {},
    create: {
      name: "Standard User",
      email: "user@user.com",
      password: userPassword,
      role: "user",
    },
  });

  console.log("Database seeded with default admin and user successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
