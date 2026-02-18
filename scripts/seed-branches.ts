import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding branches...");

  // Cairo Main Office
  const cairoBranch = await prisma.branch.upsert({
    where: { slug: "cairo-main-office" },
    update: {},
    create: {
      name: "Cairo Main Office",
      slug: "cairo-main-office",
      address: "123 Travel Street\nDowntown, Cairo",
      city: "Cairo",
      country: "Egypt",
      latitude: 30.0444,
      longitude: 31.2357,
      phone: "+20 2 1234 5678",
      phoneAlt: "+20 2 1234 5679",
      email: "info@tourismco.com",
      emailAlt: "support@tourismco.com",
      workingHours: {
        monday: "9:00 AM - 5:00 PM",
        tuesday: "9:00 AM - 5:00 PM",
        wednesday: "9:00 AM - 5:00 PM",
        thursday: "9:00 AM - 5:00 PM",
        friday: "9:00 AM - 3:00 PM",
        saturday: "Closed",
        sunday: "Closed",
      },
      isActive: true,
      displayOrder: 0,
    },
  });

  console.log("Created Cairo branch:", cairoBranch.name);

  // Alexandria Branch
  const alexandriaBranch = await prisma.branch.upsert({
    where: { slug: "alexandria-branch" },
    update: {},
    create: {
      name: "Alexandria Branch",
      slug: "alexandria-branch",
      address: "456 Corniche Road\nAlexandria",
      city: "Alexandria",
      country: "Egypt",
      latitude: 31.2001,
      longitude: 29.9187,
      phone: "+20 3 2345 6789",
      phoneAlt: "+20 3 2345 6790",
      email: "alexandria@tourismco.com",
      emailAlt: null,
      workingHours: {
        monday: "9:00 AM - 5:00 PM",
        tuesday: "9:00 AM - 5:00 PM",
        wednesday: "9:00 AM - 5:00 PM",
        thursday: "9:00 AM - 5:00 PM",
        friday: "9:00 AM - 3:00 PM",
        saturday: "Closed",
        sunday: "Closed",
      },
      isActive: true,
      displayOrder: 1,
    },
  });

  console.log("Created Alexandria branch:", alexandriaBranch.name);

  console.log("Branch seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


