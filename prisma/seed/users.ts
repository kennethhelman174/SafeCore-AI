import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash("SafeCore2026!", 10);
  
  const roles = await prisma.role.findMany();
  const depts = await prisma.department.findMany();

  const getRole = (name: string) => roles.find(r => r.name === name)?.id || roles[0].id;
  const getDept = (name: string) => depts.find(d => d.name === name)?.id || depts[0].id;

  const users = [
    { email: "admin@warehouse.local", name: "System Admin", role: "Administrator", dept: "Safety / EHS" },
    { email: "manager@warehouse.local", name: "Site Manager", role: "Site Leader", dept: "Leadership" },
    { email: "ehs@warehouse.local", name: "EHS Lead", role: "EHS Manager", dept: "Safety / EHS" },
    { email: "supervisor.shipping@warehouse.local", name: "Shipping Supervisor", role: "Shipping Supervisor", dept: "Shipping" },
    { email: "maintenance.tech@warehouse.local", name: "Main Tech", role: "Maintenance Technician", dept: "Maintenance" },
    { email: "associate.pick@warehouse.local", name: "Picker One", role: "Warehouse Associate", dept: "Warehouse Operations" },
    { email: "training.coord@warehouse.local", name: "Training Lead", role: "Training Coordinator", dept: "Training" }
  ];

  console.log(`Seeding ${users.length} users...`);

  const results = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        name: u.name,
        password: hashedPassword,
        roleId: getRole(u.role),
        departmentId: getDept(u.dept)
      },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        roleId: getRole(u.role),
        departmentId: getDept(u.dept)
      }
    });
    results.push(user);
  }
  return results;
}
