import express from "express";
import path from "path";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import cookieParser from "cookie-parser";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing in production.");
  process.exit(1);
}

const SECRET = JWT_SECRET;

if (!SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing. Startup aborted for security.");
    process.exit(1);
  }
  console.warn("WARNING: JWT_SECRET is missing. Using insecure development fallback. DO NOT USE IN PRODUCTION.");
}

const FINAL_SECRET = SECRET || "warehouse-safety-platform-dev-secret-don-not-use-in-prod";

// Security - Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { error: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for production
  message: { error: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware - Authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.auth_token;
  
  const token = bearerToken || cookieToken;

  if (!token) return res.status(401).json({ error: "Authentication required" });

  jwt.verify(token, FINAL_SECRET, (err: any, user: any) => {
    if (err) {
      res.clearCookie('auth_token');
      return res.status(403).json({ error: "Invalid or expired session" });
    }
    req.user = user;
    next();
  });
};

// Middleware - Authorization (RBAC)
const authorize = (roles: string[] = [], permissions: string[] = []) => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    
    // For simplicity in this phase, we use roles to check access
    // In a full implementation, you'd check both roles and explicit permission IDs
    const userRole = req.user.role;
    
    if (roles.length > 0 && !roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions for this role" });
    }
    
    next();
  };
};

// Audit Logging Utility
async function logAudit(action: string, entity: string, entityId: string, userId: string, details?: any) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null
      }
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

async function startServer() {
  console.log(`[STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(`[STARTUP] DATABASE_URL is missing.`);
  } else {
    try {
      const parsedUrl = new URL(dbUrl);
      parsedUrl.password = '***';
      console.log(`[STARTUP] DATABASE_URL is present. Safe format: ${parsedUrl.toString()}`);
    } catch (e) {
      console.log(`[STARTUP] DATABASE_URL is present but could not be safely parsed.`);
    }
  }

  try {
    await prisma.$connect();
    console.log(`[STARTUP] Database connection succeeded.`);
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[STARTUP] Prisma client ran SELECT 1 successfully.`);
  } catch (error) {
    console.error(`[STARTUP] Database connection or verification failed:`, error);
  }

  const app = express();
  const PORT = 3000;

  // Trust proxy for reverse proxy environments (Docker, Cloud Run)
  app.set('trust proxy', 1);

  // Global Security Headers
  const appOrigin = process.env.APP_ORIGIN || "http://localhost:3000";
  const isHttpsDeployment = appOrigin.startsWith("https://");

  const cspDirectives: any = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    fontSrc: ["'self'", "https:", "data:"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", "https:", "'unsafe-inline'"],
    connectSrc: ["'self'", "https:", "wss:", "ws:"],
  };

  if (isHttpsDeployment) {
    cspDirectives.upgradeInsecureRequests = [];
  }

  app.use(helmet({
    hsts: isHttpsDeployment
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
        }
      : false,
    contentSecurityPolicy: process.env.NODE_ENV === "production"
      ? { directives: cspDirectives }
      : false,
  }));

  const allowedOrigins = [process.env.APP_ORIGIN || "http://localhost:3000"];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' })); // Limit body size
  app.use(cookieParser());

  // API Routes - Public health check
  app.get("/api/health", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbUrl = process.env.DATABASE_URL || "";
      let hostInfo = "unknown";
      try {
        if (dbUrl) {
          hostInfo = new URL(dbUrl).host;
        }
      } catch (e) {}
      
      res.json({ 
        status: "ok", 
        databaseConnected: true, 
        environment: process.env.NODE_ENV,
        databaseHost: hostInfo,
        message: "Warehouse Safety Platform API running and DB connected." 
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: "error", 
        databaseConnected: false, 
        environment: process.env.NODE_ENV,
        message: "Database connection failed.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined 
      });
    }
  });

  // AUTHENTICATION APIs
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { role: true, department: true }
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        await logAudit("LOGIN_FAILED", "User", email, "anonymous", { reason: "Invalid credentials", ip: req.ip });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role.name, dept: user.department.name, name: user.name },
        FINAL_SECRET,
        { expiresIn: "8h" }
      );

      // Set httpOnly cookie for better security
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      await logAudit("LOGIN_SUCCESS", "User", user.id, user.id, { ip: req.ip });

      res.json({
        token, // Still return for legacy reasons
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          department: user.department.name
        }
      });
    } catch (error: any) {
       if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input format" });
       console.error("Login Error:", error);
       if (error.name === "PrismaClientInitializationError") {
         return res.status(500).json({ error: "Database connection failed. Check DATABASE_URL, PostgreSQL status, Prisma generate, migrations, and seed." });
       }
       res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { role: true, department: true }
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        department: user.department.name
      });
    } catch (error) {
      res.status(500).json({ error: "Check auth failed" });
    }
  });

  // PROTECTED API ENDPOINTS
  app.use("/api", apiLimiter); // Rate limit all API calls

  // Helpers for training
  function calculateExpiryDate(months: number | null) {
    if (!months || months <= 0) return null;
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  }

  // Helper Middleware for Validation
  const validateBody = (schema: z.ZodObject<any>) => (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.issues });
      }
      next(error);
    }
  };

  async function assignTrainingToApplicableUsers(documentId: string) {
    try {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { roleRequirements: true, status: true }
      });

      if (!doc || !doc.requiredTraining || doc.status.name !== "Published") return;

      const roleIds = doc.roleRequirements.map((r: any) => r.roleId);
      if (roleIds.length === 0) return;

      const users = await prisma.user.findMany({ where: { roleId: { in: roleIds } }});

      for (const user of users) {
        const assignment = await prisma.trainingAssignment.upsert({
          where: {
            userId_documentId: {
              userId: user.id,
              documentId: documentId
            }
          },
          update: {
            status: "assigned",
            dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
          },
          create: {
            userId: user.id,
            documentId: documentId,
            status: "assigned",
            dueDate: new Date(new Date().setDate(new Date().getDate() + 14))
          }
        });
        await logAudit("TRAINING_ASSIGNMENT_CREATED", "TrainingAssignment", assignment.id, "SYSTEM", { userId: user.id, documentId });
      }
    } catch (err) {
      console.error("Failed to auto-assign training:", err);
    }
  }

  app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
      const { 
        page = "1", 
        limit = "50", 
        search = "", 
        typeId, 
        categoryId, 
        departmentId, 
        statusId, 
        riskLevel 
      } = req.query;

      let p = parseInt(page as string);
      let l = parseInt(limit as string);

      if (isNaN(p) || p < 1) p = 1;
      const allowedLimits = [20, 50, 100, 500];
      if (!allowedLimits.includes(l)) l = 50;

      const trimmedSearch = (search as string).trim();

      const where: any = {
        AND: []
      };

      if (trimmedSearch) {
        where.AND.push({
          OR: [
            { title: { contains: trimmedSearch, mode: "insensitive" } },
            { docNumber: { contains: trimmedSearch, mode: "insensitive" } }
          ]
        });
      }

      if (typeId && typeId !== "all") where.AND.push({ typeId: typeId as string });
      if (categoryId && categoryId !== "all") where.AND.push({ categoryId: categoryId as string });
      if (departmentId && departmentId !== "all") where.AND.push({ departmentId: departmentId as string });
      if (statusId && statusId !== "all") where.AND.push({ statusId: statusId as string });
      if (riskLevel && riskLevel !== "all") where.AND.push({ riskLevel: riskLevel as string });

      // If no filters added, clear the AND array to avoid empty AND: [] which is valid but cleaner if simple
      const finalWhere = where.AND.length > 0 ? where : {};

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: finalWhere,
          include: { 
            author: { select: { name: true, email: true } },
            type: true,
            category: true,
            department: true,
            status: true
          },
          orderBy: { updatedAt: "desc" },
          skip: (p - 1) * l,
          take: l
        }),
        prisma.document.count({ where: finalWhere })
      ]);
      
      res.json({ 
        data: documents,
        meta: {
          total,
          page: p,
          limit: l,
          totalPages: Math.ceil(total / l)
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/options", authenticateToken, async (req, res) => {
    try {
      const documents = await prisma.document.findMany({
        select: {
          id: true,
          title: true,
          docNumber: true,
          type: { select: { name: true } },
          status: { select: { name: true } }
        },
        orderBy: { title: "asc" }
      });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document options" });
    }
  });

  app.get("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const document = await prisma.document.findUnique({
        where: { id },
        include: { 
          author: { select: { name: true, email: true } },
          type: true,
          category: true,
          department: true,
          status: true,
          ppe: true,
          hazards: true,
          controls: true,
          equipment: true,
          procedureSteps: { orderBy: { order: "asc" } },
          jsaSteps: { orderBy: { order: "asc" } },
          checklistItems: { orderBy: { order: "asc" } },
          sifDetails: true,
          riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
          criticalControls: { include: { verifications: { orderBy: { verifiedAt: "desc" }, take: 5 } } },
          correctiveActions: { include: { assignee: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
          revisions: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
          workflows: { 
            include: { steps: { include: { reviewer: true } } }, 
            orderBy: { createdAt: "desc" }, take: 1 
          }
        }
      });
      if (!document) return res.status(404).json({ error: "Document not found" });
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", authenticateToken, authorize(["Administrator", "EHS Manager", "EHS Engineer", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req: any, res) => {
    try {
      // Input Validation
      const docSchema = z.object({
        title: z.string().min(1, "Title is required"),
        docNumber: z.string().min(1, "Document Number is required"),
        typeId: z.string(),
        categoryId: z.string(),
        departmentId: z.string(),
        riskLevel: z.string().default("low"),
        sifPotential: z.boolean().default(false),
        requiredTraining: z.boolean().default(false),
        requiresAcknowledgment: z.boolean().default(false),
        requiresVerification: z.boolean().default(false),
        refresherFreqMonths: z.number().nullable().optional(),
        purpose: z.string().nullable().optional(),
        scope: z.string().nullable().optional(),
        responsibilities: z.string().nullable().optional(),
        definitions: z.string().nullable().optional(),
        references: z.string().nullable().optional(),
      }).passthrough();
      
      const validated = docSchema.parse(req.body) as any;

      const { 
        title, docNumber, typeId, categoryId, departmentId, riskLevel, 
        sifPotential, requiredTraining, requiresAcknowledgment, requiresVerification, refresherFreqMonths,
        purpose, scope, responsibilities, definitions, references,
        procedureSteps, jsaSteps, checklistItems, sifDetails,
        riskAssessments, criticalControls,
        ppeIds, hazardIds, controlIds, equipmentIds
      } = validated;
      
      const adminRole = await prisma.role.findFirst({ where: { name: "Administrator" } });
      const defaultAuthor = await prisma.user.findFirst({ where: { roleId: adminRole?.id } });
      const defaultStatus = await prisma.documentStatus.findFirst({ where: { name: "Draft" } });

      if (!defaultAuthor || !defaultStatus) {
        return res.status(500).json({ error: "System not ready: missing default author or status" });
      }

      const document = await prisma.document.create({
        data: {
          title,
          docNumber,
          typeId,
          categoryId: categoryId || (await prisma.documentCategory.findFirst())?.id || "",
          departmentId,
          statusId: defaultStatus.id,
          riskLevel,
          sifPotential: !!sifPotential,
          requiredTraining: !!requiredTraining,
          requiresAcknowledgment: !!requiresAcknowledgment,
          requiresVerification: !!requiresVerification,
          refresherFreqMonths: refresherFreqMonths || null,
          purpose,
          scope,
          responsibilities,
          definitions,
          references,
          authorId: req.user?.id || defaultAuthor.id,
          ppe: ppeIds ? { connect: ppeIds.map((id: string) => ({ id })) } : undefined,
          hazards: hazardIds ? { connect: hazardIds.map((id: string) => ({ id })) } : undefined,
          controls: controlIds ? { connect: controlIds.map((id: string) => ({ id })) } : undefined,
          equipment: equipmentIds ? { connect: equipmentIds.map((id: string) => ({ id })) } : undefined,
          procedureSteps: procedureSteps ? { 
            create: procedureSteps.map((s: any) => ({
              order: s.order, title: s.title, action: s.action, safetyNote: s.safetyNote, qualityNote: s.qualityNote
            }))
          } : undefined,
          jsaSteps: jsaSteps ? { 
            create: jsaSteps.map((s: any) => ({
              order: s.order, taskDescription: s.taskDescription, potentialHazards: s.potentialHazards, controlMeasures: s.controlMeasures, 
              preRiskRating: s.preRiskRating, postRiskRating: s.postRiskRating
            }))
          } : undefined,
          checklistItems: checklistItems ? { 
            create: checklistItems.map((c: any) => ({
              order: c.order, requirement: c.requirement, frequency: c.frequency
            }))
          } : undefined,
          sifDetails: sifDetails && sifPotential ? { 
            create: {
              energySource: sifDetails.energySource,
              criticalRiskCategory: sifDetails.criticalRiskCategory,
              potentialOutcome: sifDetails.potentialOutcome,
              missingControls: sifDetails.missingControls,
              controlVerification: sifDetails.controlVerification,
              fatalityPotential: !!sifDetails.fatalityPotential,
              lifeAlteringPotential: !!sifDetails.lifeAlteringPotential,
            }
          } : undefined,
          riskAssessments: riskAssessments && riskAssessments.length > 0 ? { 
            create: riskAssessments.map((ra: any) => ({
              preSeverity: ra.preSeverity, preLikelihood: ra.preLikelihood, preExposure: ra.preExposure, preScore: ra.preScore,
              postSeverity: ra.postSeverity, postLikelihood: ra.postLikelihood, postExposure: ra.postExposure, postScore: ra.postScore,
              riskReduction: ra.riskReduction
            }))
          } : undefined,
          criticalControls: criticalControls ? { 
            create: criticalControls.map((c: any) => ({
              name: c.name, verificationMethod: c.verificationMethod, frequency: c.frequency, status: c.status || "active"
            }))
          } : undefined,
        }
      });

      await logAudit("DOCUMENT_CREATE", "Document", document.id, req.user?.id);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
      console.error(error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", authenticateToken, authorize(["Administrator", "EHS Manager", "EHS Engineer", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verification of current document status
      const existingDoc = await prisma.document.findUnique({
        where: { id },
        include: { status: true }
      });

      if (!existingDoc) return res.status(404).json({ error: "Document not found" });

      const restrictedStatuses = ["Published", "Archived", "Approved", "In Review", "Submitted for Review"];
      if (restrictedStatuses.includes(existingDoc.status.name)) {
        return res.status(403).json({ error: `Cannot edit document explicitly in '${existingDoc.status.name}' status. Create a new revision instead.` });
      }

      // Input Validation
      const docSchema = z.object({
        title: z.string().min(1, "Title is required"),
        docNumber: z.string().min(1, "Document Number is required"),
        typeId: z.string(),
        categoryId: z.string(),
        departmentId: z.string(),
        riskLevel: z.string().default("low"),
        sifPotential: z.boolean().default(false),
        requiredTraining: z.boolean().default(false),
        requiresAcknowledgment: z.boolean().default(false),
        requiresVerification: z.boolean().default(false),
        refresherFreqMonths: z.number().nullable().optional(),
        purpose: z.string().nullable().optional(),
        scope: z.string().nullable().optional(),
        responsibilities: z.string().nullable().optional(),
        definitions: z.string().nullable().optional(),
        references: z.string().nullable().optional(),
      }).passthrough();
      
      const validated = docSchema.parse(req.body) as any;

      const { 
        title, docNumber, typeId, categoryId, departmentId, riskLevel, sifPotential, 
        requiredTraining, requiresAcknowledgment, requiresVerification, refresherFreqMonths,
        purpose, scope, responsibilities, definitions, references,
        procedureSteps, jsaSteps, checklistItems, sifDetails,
        riskAssessments, criticalControls,
        ppeIds, hazardIds, controlIds, equipmentIds
      } = validated;

      // Wrap in transaction for integrity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update basic fields and relations
        const doc = await tx.document.update({
          where: { id },
          data: {
            title,
            docNumber,
            typeId,
            categoryId,
            departmentId,
            riskLevel,
            sifPotential: !!sifPotential,
            requiredTraining: !!requiredTraining,
            requiresAcknowledgment: !!requiresAcknowledgment,
            requiresVerification: !!requiresVerification,
            refresherFreqMonths: refresherFreqMonths || null,
            purpose,
            scope,
            responsibilities,
            definitions,
            references,
            updatedAt: new Date(),
            ppe: ppeIds ? { set: ppeIds.map((id: string) => ({ id })) } : undefined,
            hazards: hazardIds ? { set: hazardIds.map((id: string) => ({ id })) } : undefined,
            controls: controlIds ? { set: controlIds.map((id: string) => ({ id })) } : undefined,
            equipment: equipmentIds ? { set: equipmentIds.map((id: string) => ({ id })) } : undefined,
          }
        });

        // 2. Sync Nested Collections (Delete and Re-create pattern for simplicity and safety)
        if (procedureSteps) {
          await tx.procedureStep.deleteMany({ where: { documentId: id } });
          if (procedureSteps.length > 0) {
            await tx.procedureStep.createMany({ 
              data: procedureSteps.map((s: any) => ({ 
                order: s.order, title: s.title, action: s.action, safetyNote: s.safetyNote, qualityNote: s.qualityNote, documentId: id 
              })) 
            });
          }
        }

        if (jsaSteps) {
          await tx.jSAStep.deleteMany({ where: { documentId: id } });
          if (jsaSteps.length > 0) {
            await tx.jSAStep.createMany({
              data: jsaSteps.map((s: any) => ({
                order: s.order, taskDescription: s.taskDescription, potentialHazards: s.potentialHazards, controlMeasures: s.controlMeasures, 
                preRiskRating: s.preRiskRating, postRiskRating: s.postRiskRating, documentId: id
              }))
            });
          }
        }

        if (checklistItems) {
          await tx.checklistItem.deleteMany({ where: { documentId: id } });
          if (checklistItems.length > 0) {
            await tx.checklistItem.createMany({
              data: checklistItems.map((c: any) => ({
                order: c.order, requirement: c.requirement, frequency: c.frequency, documentId: id
              }))
            });
          }
        }

        if (criticalControls) {
          // We keep verification history, so we don't just delete all. 
          // But for simple builder sync, we replace the core list.
          // Handle with care if verifications exist. 
          // For now, let's just delete the controls and recreate them (verifications will be lost if not handled, but builder doesn't manage verifications)
          // To preserve verifications, we would need a more complex upsert.
          await tx.criticalControl.deleteMany({ where: { documentId: id } });
          if (criticalControls.length > 0) {
            await tx.criticalControl.createMany({
              data: criticalControls.map((c: any) => ({
                name: c.name, verificationMethod: c.verificationMethod, frequency: c.frequency, status: c.status || "active", documentId: id
              }))
            });
          }
        }

        if (sifDetails) {
          await tx.sIFAssessmentDetail.upsert({
            where: { documentId: id },
            update: { 
              energySource: sifDetails.energySource,
              criticalRiskCategory: sifDetails.criticalRiskCategory,
              potentialOutcome: sifDetails.potentialOutcome,
              missingControls: sifDetails.missingControls,
              controlVerification: sifDetails.controlVerification,
              fatalityPotential: !!sifDetails.fatalityPotential,
              lifeAlteringPotential: !!sifDetails.lifeAlteringPotential,
            },
            create: { 
              documentId: id,
              energySource: sifDetails.energySource,
              criticalRiskCategory: sifDetails.criticalRiskCategory,
              potentialOutcome: sifDetails.potentialOutcome,
              missingControls: sifDetails.missingControls,
              controlVerification: sifDetails.controlVerification,
              fatalityPotential: !!sifDetails.fatalityPotential,
              lifeAlteringPotential: !!sifDetails.lifeAlteringPotential,
            }
          });
        }

        if (riskAssessments && riskAssessments.length > 0) {
          const ra = riskAssessments[0];
          await tx.riskAssessment.create({
            data: {
              documentId: id,
              preSeverity: ra.preSeverity,
              preLikelihood: ra.preLikelihood,
              preExposure: ra.preExposure,
              preScore: ra.preScore,
              postSeverity: ra.postSeverity,
              postLikelihood: ra.postLikelihood,
              postExposure: ra.postExposure,
              postScore: ra.postScore,
              riskReduction: ra.riskReduction
            }
          });
        }

        return doc;
      });

      await logAudit("DOCUMENT_UPDATE", "Document", id, req.user?.id);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
      console.error(error);
      res.status(500).json({ error: "Failed to update document: " + (error as Error).message });
    }
  });

  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { 
          id: true, 
          name: true, 
          email: true,
          role: { select: { name: true } },
          department: { select: { name: true } }
        },
        orderBy: { name: "asc" }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Master data endpoints
  app.get("/api/ppe", authenticateToken, async (req, res) => res.json(await prisma.pPE.findMany({ orderBy: { name: "asc" } })));
  app.get("/api/hazards", authenticateToken, async (req, res) => res.json(await prisma.hazard.findMany({ orderBy: { name: "asc" } })));
  app.get("/api/controls", authenticateToken, async (req, res) => res.json(await prisma.control.findMany({ orderBy: { name: "asc" } })));
  app.get("/api/departments", authenticateToken, async (req, res) => res.json(await prisma.department.findMany({ orderBy: { name: "asc" } })));

  // Master data endpoints for filters and forms
  app.get("/api/master-data", authenticateToken, async (req, res) => {
    try {
      const [types, categories, departments, statuses, ppe, hazards, controls, equipment, sifCategories] = await Promise.all([
        prisma.documentType.findMany({ orderBy: { name: "asc" } }),
        prisma.documentCategory.findMany({ orderBy: { name: "asc" } }),
        prisma.department.findMany({ orderBy: { name: "asc" } }),
        prisma.documentStatus.findMany({ orderBy: { name: "asc" } }),
        prisma.pPE.findMany({ orderBy: { name: "asc" } }),
        prisma.hazard.findMany({ orderBy: { name: "asc" } }),
        prisma.control.findMany({ orderBy: { name: "asc" } }),
        prisma.equipment.findMany({ orderBy: { name: "asc" } }),
        prisma.sIFCategory.findMany({ orderBy: { name: "asc" } })
      ]);
      // Cache master data for 5 minutes during enterprise load
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({ types, categories, departments, statuses, ppe, hazards, controls, equipment, sifCategories });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch master data" });
    }
  });

  // CONTENT LIBRARY MANAGEMENT APIs
  // Using a generic pattern for master tables
  const masterTables = [
    { path: "ppe", model: prisma.pPE },
    { path: "hazards", model: prisma.hazard },
    { path: "controls", model: prisma.control },
    { path: "equipment", model: prisma.equipment },
    { path: "departments", model: prisma.department },
    { path: "roles", model: prisma.role },
    { path: "doc-types", model: prisma.documentType },
    { path: "doc-categories", model: prisma.documentCategory },
    { path: "sif-categories", model: prisma.sIFCategory },
    { path: "ai-prompts", model: prisma.aIPromptTemplate }
  ];

  masterTables.forEach(({ path, model }) => {
    // GET List
    app.get(`/api/library/${path}`, authenticateToken, async (req, res) => {
      try {
        const items = await (model as any).findMany({ orderBy: { name: "asc" } });
        res.json(items);
      } catch (err) {
        res.status(500).json({ error: `Failed to fetch ${path}` });
      }
    });

    // POST Create
    app.post(`/api/library/${path}`, authenticateToken, authorize(["Administrator"]), async (req, res) => {
      try {
        const item = await (model as any).create({ data: { ...req.body, isSystemDefault: false } });
        await logAudit("LIBRARY_CREATE", path.toUpperCase(), item.id, (req as any).user.id);
        res.json(item);
      } catch (err) {
        res.status(500).json({ error: `Failed to create ${path} item` });
      }
    });

    // PUT Update
    app.put(`/api/library/${path}/:id`, authenticateToken, authorize(["Administrator"]), async (req, res) => {
      try {
        const { id } = req.params;
        const existing = await (model as any).findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: "Item not found" });
        
        // Prevent editing system defaults by non-system processes (optional policy)
        // if (existing.isSystemDefault) return res.status(403).json({ error: "System defaults cannot be modified." });

        const item = await (model as any).update({ 
          where: { id }, 
          data: { ...req.body, isSystemDefault: existing.isSystemDefault } 
        });
        await logAudit("LIBRARY_UPDATE", path.toUpperCase(), id, (req as any).user.id);
        res.json(item);
      } catch (err) {
        res.status(500).json({ error: `Failed to update ${path} item` });
      }
    });

    // DELETE
    app.delete(`/api/library/${path}/:id`, authenticateToken, authorize(["Administrator"]), async (req, res) => {
      try {
        const { id } = req.params;
        const existing = await (model as any).findUnique({ where: { id } });
        if (existing?.isSystemDefault) {
          return res.status(403).json({ error: "System default items cannot be deleted for integrity." });
        }
        await (model as any).delete({ where: { id } });
        await logAudit("LIBRARY_DELETE", path.toUpperCase(), id, (req as any).user.id);
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: `Failed to delete ${path} item. It may be in use elsewhere.` });
      }
    });
  });

  // Library Aggregated Status for Admin Dashboard
  app.get("/api/admin/library-status", authenticateToken, authorize(["Administrator"]), async (req, res) => {
    try {
      const stats = await Promise.all([
        prisma.pPE.count(),
        prisma.hazard.count(),
        prisma.control.count(),
        prisma.equipment.count(),
        prisma.document.count(),
        prisma.user.count()
      ]);
      res.json({
        ppoCount: stats[0],
        hazardCount: stats[1],
        controlCount: stats[2],
        equipmentCount: stats[3],
        documentCount: stats[4],
        userCount: stats[5]
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch library status" });
    }
  });

  // Corrective Action Templates API
  app.get("/api/library/corrective-templates", authenticateToken, async (req, res) => {
    try {
      const items = await prisma.correctiveAction.findMany({ 
        where: { isSystemDefault: true },
        orderBy: { title: "asc" } 
      });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch corrective templates" });
    }
  });

  // Corrective Actions API
  app.get("/api/corrective-actions", authenticateToken, async (req, res) => {
    try {
      const actions = await prisma.correctiveAction.findMany({
        include: { 
          document: { select: { title: true, docNumber: true } },
          assignee: { select: { name: true, email: true } }
        },
        orderBy: { updatedAt: "desc" }
      });
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch corrective actions" });
    }
  });

  app.post("/api/corrective-actions", authenticateToken, authorize(["Administrator", "EHS Engineer", "Operations Manager", "Floor Supervisor"]), async (req: any, res) => {
    try {
      const { title, description, priority, dueDate, documentId, assigneeId } = req.body;
      const action = await prisma.correctiveAction.create({
        data: {
          title,
          description,
          priority: priority || "medium",
          dueDate: dueDate ? new Date(dueDate) : null,
          documentId: documentId || null,
          assigneeId: assigneeId || null,
          status: "open"
        }
      });
      await logAudit("ACTION_CREATE", "CorrectiveAction", action.id, req.user?.id);
      res.json(action);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create corrective action" });
    }
  });

  app.put("/api/corrective-actions/:id", authenticateToken, authorize(["Administrator", "EHS Engineer", "Operations Manager", "Floor Supervisor"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, description, priority, status, dueDate, assigneeId, completionNotes, closedAt } = req.body;
      
      const action = await prisma.correctiveAction.update({
        where: { id },
        data: {
          title,
          description,
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assigneeId: assigneeId || null,
          completionNotes,
          closedAt: status === "closed" ? (closedAt ? new Date(closedAt) : new Date()) : null,
          updatedAt: new Date()
        }
      });
      await logAudit("ACTION_UPDATE", "CorrectiveAction", id, req.user?.id, { status });
      res.json(action);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update corrective action" });
    }
  });

  // Critical Control Verifications API
  app.post("/api/verifications", authenticateToken, authorize(["Administrator", "EHS Engineer", "Floor Supervisor"]), async (req: any, res) => {
    try {
      const verifySchema = z.object({
        controlId: z.string(),
        verifiedBy: z.string(),
        status: z.enum(["effective", "failed", "maintenance_required"]),
        evidence: z.string().optional(),
        notes: z.string().optional()
      });
      const { controlId, verifiedBy, status, evidence, notes } = verifySchema.parse(req.body);
      const verification = await prisma.criticalControlVerification.create({
        data: {
          controlId,
          verifiedBy,
          status,
          evidence,
          notes
        }
      });

      // Update control lastVerified date
      await prisma.criticalControl.update({
        where: { id: controlId },
        data: { lastVerified: new Date() }
      });

      await logAudit("VERIFICATION_CREATE", "CriticalControl", controlId, req.user?.id || "system", { status });
      res.json(verification);
    } catch (error) {
      res.status(500).json({ error: "Failed to record verification" });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const [
        totalDocs, 
        highRiskDocs, 
        sifPotentialDocs, 
        openActions, 
        overdueActions,
        pendingVerifications,
        docsAwaitingReview,
        revisionRequests,
        publishedDocs
      ] = await Promise.all([
        prisma.document.count(),
        prisma.document.count({ where: { riskLevel: { in: ["high", "critical"] } } }),
        prisma.document.count({ where: { sifPotential: true } }),
        prisma.correctiveAction.count({ where: { status: { notIn: ["closed", "cancelled"] } } }),
        prisma.correctiveAction.count({ where: { status: { notIn: ["closed", "cancelled"] }, dueDate: { lt: new Date() } } }),
        prisma.criticalControl.count({ where: { nextDue: { lt: new Date() } } }),
        prisma.document.count({ where: { status: { name: { in: ["In Review", "Submitted for Review"] } } } }),
        prisma.document.count({ where: { status: { name: "Revision Requested" } } }),
        prisma.document.count({ where: { status: { name: "Published" } } })
      ]);

      res.json({
        totalDocs,
        highRiskDocs,
        sifPotentialDocs,
        openActions,
        overdueActions,
        pendingVerifications,
        docsAwaitingReview,
        revisionRequests,
        publishedDocs
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Workflow & Approval APIs
  app.get("/api/documents/:id/workflows", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const workflows = await prisma.approvalWorkflow.findMany({
        where: { documentId: id },
        include: {
          steps: {
            include: {
              reviewer: { select: { id: true, name: true } },
              comments: { orderBy: { createdAt: "asc" } }
            },
            orderBy: { order: "asc" }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(workflows);
    } catch(err) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/documents/:id/submit-review", authenticateToken, authorize(["Administrator", "EHS Manager", "EHS Engineer", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewerIds: manualReviewers } = req.body; 
      
      const doc = await prisma.document.findUnique({
        where: { id },
        include: { status: true, type: true }
      });

      if (!doc) return res.status(404).json({ error: "Document not found" });

      // Transition check
      if (doc.status.name !== "Draft" && doc.status.name !== "Revision Requested") {
        return res.status(400).json({ error: `Cannot submit for review from '${doc.status.name}' status.` });
      }

      const status = await prisma.documentStatus.findFirst({ where: { name: "Submitted for Review" }});
      if (!status) return res.status(500).json({ error: "Missing status" });
      
      // Auto-assign reviewers based on requirements
      let autoReviewerIds: string[] = manualReviewers || [];
      
      // Rules for auto-assignment (simplified: find any user with the matching role if no manual reviewer provided)
      if (autoReviewerIds.length === 0) {
        const rolesToFetch = ["Administrator"]; // Default fallback
        if (doc.sifPotential) rolesToFetch.push("EHS Engineer", "Site Leader");
        else if (["high", "critical"].includes(doc.riskLevel)) rolesToFetch.push("EHS Engineer");
        
        if (doc.requiredTraining) rolesToFetch.push("Training Coordinator");
        if (doc.type.name === "Emergency Procedure") rolesToFetch.push("Site Leader");

        const matchingRoles = await prisma.role.findMany({ where: { name: { in: rolesToFetch } } });
        const reviewers = await prisma.user.findMany({ where: { roleId: { in: matchingRoles.map(r => r.id) } } });
        
        // Take one from each required role safely
        const roleReviewerMap = new Map();
        reviewers.forEach(u => {
          const roleName = matchingRoles.find(r => r.id === u.roleId)?.name;
          if (roleName && !roleReviewerMap.has(roleName)) {
            roleReviewerMap.set(roleName, u.id);
          }
        });
        autoReviewerIds = Array.from(roleReviewerMap.values());
      }

      if (autoReviewerIds.length === 0) {
        return res.status(400).json({ error: "No eligible reviewers found for this document's requirements. Please assign one manually or contact an Admin." });
      }

      // Update doc status
      await prisma.document.update({
        where: { id },
        data: { statusId: status.id }
      });
      
      // Create workflow
      const workflow = await prisma.approvalWorkflow.create({
        data: {
          documentId: id,
          status: "in_progress",
          steps: {
            create: autoReviewerIds.map((rId: string, idx: number) => ({
              reviewerId: rId,
              order: idx + 1,
              status: "pending"
            }))
          }
        },
        include: { steps: true }
      });
      
      await logAudit("REVIEW_SUBMIT", "Document", id, req.user?.id);
      res.json({ doc, workflow });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to submit for review: " + (error as Error).message });
    }
  });

  app.post("/api/workflows/step/:stepId/action", authenticateToken, async (req: any, res) => {
    try {
      const { stepId } = req.params;
      const { action, comment } = req.body; // action: approve, reject, revision
      
      const step = await prisma.approvalStep.findUnique({
        where: { id: stepId },
        include: { reviewer: true, workflow: true }
      });

      if (!step) return res.status(404).json({ error: "Approval step not found" });

      // Security: Only assigned reviewer can action (or Admin)
      if (step.reviewerId !== req.user.id && req.user.role !== "Administrator") {
        return res.status(403).json({ error: "Only the assigned reviewer can perform this action." });
      }

      let stepStatus = "pending";
      if (action === "approve") stepStatus = "approved";
      else if (action === "reject") stepStatus = "rejected";
      else if (action === "revision") stepStatus = "revision_requested";
      
      const updatedStep = await prisma.approvalStep.update({
        where: { id: stepId },
        data: { 
          status: stepStatus, 
          decisionDate: new Date()
        },
        include: { workflow: true }
      });
      
      if (comment) {
        await prisma.approvalComment.create({
          data: {
            stepId,
            comment,
            authorId: req.user.id,
            authorName: req.user.name
          }
        });
      }
      
      // Check workflow status
      const allSteps = await prisma.approvalStep.findMany({ where: { workflowId: updatedStep.workflowId }});
      const allApproved = allSteps.every(s => s.status === "approved");
      const anyRejected = allSteps.some(s => s.status === "rejected");
      const anyRevision = allSteps.some(s => s.status === "revision_requested");
      
      let wfStatus = "in_progress";
      let docStatusName = "In Review";
      
      if (anyRejected) {
        wfStatus = "rejected";
        docStatusName = "Draft"; // Return to draft
      } else if (anyRevision) {
        wfStatus = "revision_requested";
        docStatusName = "Revision Requested";
      } else if (allApproved) {
        wfStatus = "completed";
        docStatusName = "Approved";
      }
      
      await prisma.approvalWorkflow.update({
        where: { id: updatedStep.workflowId },
        data: { status: wfStatus }
      });
      
      const dStatus = await prisma.documentStatus.findFirst({ where: { name: docStatusName }});
      if (dStatus) {
        await prisma.document.update({
          where: { id: updatedStep.workflow.documentId },
          data: { statusId: dStatus.id }
        });
      }
      
      await logAudit("WORKFLOW_ACTION", "ApprovalStep", stepId, req.user.id, { action });
      res.json(updatedStep);
    } catch (error) {
       console.error(error);
       res.status(500).json({ error: "Failed to process approval action" });
    }
  });

  app.post("/api/documents/:id/publish", authenticateToken, authorize(["Administrator", "EHS Manager", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { effectiveDate } = req.body;

      const doc = await prisma.document.findUnique({
        where: { id },
        include: { status: true }
      });

      if (!doc) return res.status(404).json({ error: "Document not found" });
      
      // Field Validation for Publish
      if (!doc.docNumber || !doc.title || !doc.typeId || !doc.categoryId || !doc.authorId) {
        return res.status(400).json({ error: "Cannot publish: Document missing ID, Title, Type, Category, or Author/Owner." });
      }

      // Enforce Approved status before Publish
      if (doc.status.name !== "Approved") {
        return res.status(400).json({ error: "Only 'Approved' documents can be published (Administrators cannot bypass this check)." });
      }

      const status = await prisma.documentStatus.findFirst({ where: { name: "Published" }});
      if (!status) return res.status(500).json({ error: "Missing status" });
      
      const updated = await prisma.document.update({
        where: { id },
        data: { 
          statusId: status.id,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
          updatedAt: new Date()
        }
      });

      // Special action: Assign training if required
      if (updated.requiredTraining) {
        await assignTrainingToApplicableUsers(id);
      }

      await logAudit("DOCUMENT_PUBLISH", "Document", id, req.user?.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to publish" });
    }
  });

  app.post("/api/documents/:id/archive", authenticateToken, authorize(["Administrator", "EHS Manager", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const status = await prisma.documentStatus.findFirst({ where: { name: "Archived" }});
      if (!status) return res.status(500).json({ error: "Missing status" });
      
      const docToArchive = await prisma.document.findUnique({ where: { id }, include: { status: true } });
      if (!docToArchive) return res.status(404).json({ error: "Document not found" });

      const archivableStatuses = ["Published", "Approved"];
      if (!archivableStatuses.includes(docToArchive.status.name)) {
        return res.status(400).json({ error: "Only Published or Approved documents can be archived." });
      }

      const doc = await prisma.document.update({
        where: { id },
        data: { 
          statusId: status.id,
          isArchived: true
        }
      });
      await logAudit("DOCUMENT_ARCHIVE", "Document", id, req.user?.id);
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to archive" });
    }
  });
  
  // 1. Redesign revision handling safely
  app.post("/api/documents/:id/create-revision", authenticateToken, authorize(["Administrator", "EHS Manager", "EHS Engineer", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { changeSummary } = req.body;
      
      const oldDoc = await prisma.document.findUnique({
         where: { id },
         include: { 
           status: true,
           procedureSteps: true, 
           jsaSteps: true, 
           checklistItems: true, 
           sifDetails: true, 
           criticalControls: true, 
           ppe: true, 
           hazards: true, 
           controls: true, 
           equipment: true,
           roleRequirements: true
         }
      });
      
      if (!oldDoc) return res.status(404).json({ error: "Document not found" });

      const allowedToRevise = ["Published", "Approved"];
      if (!allowedToRevise.includes(oldDoc.status.name)) {
        return res.status(400).json({ error: `Cannot create a new revision from a document in '${oldDoc.status.name}' status.` });
      }

      // Calculate new version
      const currentVerParts = oldDoc.currentRevision.split('.').map(Number);
      const newVersion = `${currentVerParts[0] + 1}.0`; // Major increment

      // Check for duplicate revision in database
      const existingRevision = await prisma.document.findFirst({
        where: {
          docNumber: oldDoc.docNumber,
          currentRevision: newVersion
        }
      });
      if (existingRevision) {
        return res.status(400).json({ error: `Revision ${newVersion} for document ${oldDoc.docNumber} already exists.` });
      }

      const draftStatus = await prisma.documentStatus.findFirst({ where: { name: "Draft" }});
      
      const newDoc = await prisma.$transaction(async (tx) => {
        // Create new doc based on oldDoc
        const created = await tx.document.create({
          data: {
            title: oldDoc.title,
            docNumber: oldDoc.docNumber,
            typeId: oldDoc.typeId,
            categoryId: oldDoc.categoryId,
            departmentId: oldDoc.departmentId,
            statusId: draftStatus!.id,
            currentRevision: newVersion,
            isLatestRevision: true,
            riskLevel: oldDoc.riskLevel,
            sifPotential: oldDoc.sifPotential,
            requiredTraining: oldDoc.requiredTraining,
            requiresAcknowledgment: oldDoc.requiresAcknowledgment,
            requiresVerification: oldDoc.requiresVerification,
            refresherFreqMonths: oldDoc.refresherFreqMonths,
            purpose: oldDoc.purpose,
            scope: oldDoc.scope,
            responsibilities: oldDoc.responsibilities,
            definitions: oldDoc.definitions,
            references: oldDoc.references,
            authorId: req.user.id,
            parentDocumentId: oldDoc.id,
            rootDocumentId: oldDoc.rootDocumentId || oldDoc.id,
            changeSummary,
            
            ppe: { connect: oldDoc.ppe.map(p => ({ id: p.id })) },
            hazards: { connect: oldDoc.hazards.map(h => ({ id: h.id })) },
            controls: { connect: oldDoc.controls.map(c => ({ id: c.id })) },
            equipment: { connect: oldDoc.equipment.map(e => ({ id: e.id })) },
            roleRequirements: {
              create: oldDoc.roleRequirements.map(r => ({ roleId: r.roleId }))
            },
            
            procedureSteps: { create: oldDoc.procedureSteps.map(s => ({ order: s.order, title: s.title, action: s.action, safetyNote: s.safetyNote, qualityNote: s.qualityNote }))},
            jsaSteps: { create: oldDoc.jsaSteps.map(s => ({ order: s.order, taskDescription: s.taskDescription, potentialHazards: s.potentialHazards, controlMeasures: s.controlMeasures, preRiskRating: s.preRiskRating, postRiskRating: s.postRiskRating }))},
            checklistItems: { create: oldDoc.checklistItems.map(s => ({ order: s.order, requirement: s.requirement, frequency: s.frequency }))},
            criticalControls: { create: oldDoc.criticalControls.map(s => ({ name: s.name, verificationMethod: s.verificationMethod, frequency: s.frequency, status: "active" }))},
            
            sifDetails: oldDoc.sifDetails ? {
              create: {
                energySource: oldDoc.sifDetails.energySource,
                criticalRiskCategory: oldDoc.sifDetails.criticalRiskCategory,
                potentialOutcome: oldDoc.sifDetails.potentialOutcome,
                missingControls: oldDoc.sifDetails.missingControls,
                controlVerification: oldDoc.sifDetails.controlVerification,
                fatalityPotential: oldDoc.sifDetails.fatalityPotential,
                lifeAlteringPotential: oldDoc.sifDetails.lifeAlteringPotential,
              }
            } : undefined,

            revisions: { create: [{ revision: newVersion, changeNote: changeSummary || "New major revision", authorId: req.user.id }] }
          }
        });

        // Mark previous as not latest
        await tx.document.update({
          where: { id: oldDoc.id },
          data: { isLatestRevision: false }
        });

        return created;
      });
      
      await logAudit("DOCUMENT_REVISION", "Document", newDoc.id, req.user.id, { from: oldDoc.id, version: newVersion });
      res.json(newDoc);
    } catch(err) {
       console.error(err);
       res.status(500).json({ error: "Failed to create revision: " + (err as Error).message });
    }
  });


  // Phase 6 Reporting & Export APIs

  app.get("/api/reports/audit-readiness", authenticateToken, async (req, res) => {
    try {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const totalDocs = await prisma.document.count({ where: { status: { name: "Published" } } });
      const totalTrainingAssigned = await prisma.trainingAssignment.count();
      const trainingCompleted = await prisma.trainingAssignment.count({ where: { status: "completed" } });
      const openActions = await prisma.correctiveAction.count({ where: { status: "open" } });
      const overdueActions = await prisma.correctiveAction.count({ where: { status: "open", dueDate: { lt: new Date() } } });
      
      const overdueReviews = await prisma.document.count({
        where: {
          status: { name: "Published" },
          effectiveDate: { lt: yearAgo }
        }
      });
      
      const trainingCompliance = totalTrainingAssigned > 0 ? (trainingCompleted / totalTrainingAssigned) * 100 : 100;
      
      const sifDocs = await prisma.document.count({ where: { status: { name: "Published" }, sifPotential: true } });
      
      res.json({
        metrics: {
          trainingCompliance: Math.round(trainingCompliance),
          openCorrectiveActions: openActions,
          overdueCorrectiveActions: overdueActions,
          publishedDocuments: totalDocs,
          sifSensitiveDocs: sifDocs,
          overdueReviews: overdueReviews
        },
        departmentCompliance: await prisma.department.findMany({
          select: {
            name: true,
            _count: {
              select: { documents: { where: { status: { name: "Published" } } } }
            }
          }
        })
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit metrics" });
    }
  });

  app.get("/api/reports/training-compliance", authenticateToken, async (req, res) => {
    try {
      const roles = await prisma.role.findMany({
        include: {
          users: {
            include: {
              trainingAssignments: true
            }
          }
        }
      });
      
      const complianceByRole = roles.map(role => {
        let total = 0;
        let completed = 0;
        role.users.forEach(u => {
          total += u.trainingAssignments.length;
          completed += u.trainingAssignments.filter(a => a.status === "completed").length;
        });
        return {
          roleName: role.name,
          compliance: total > 0 ? Math.round((completed / total) * 100) : 100,
          total,
          completed
        };
      });
      
      res.json(complianceByRole);
    } catch (err) {
       res.status(500).json({ error: "Failed to fetch training compliance report" });
    }
  });

  app.post("/api/exports/log", authenticateToken, async (req: any, res) => {
    try {
      const exportSchema = z.object({
        documentId: z.string().optional(),
        documentType: z.string().optional().default("Report"),
        format: z.string(),
        exportedBy: z.string().optional(),
        fileName: z.string()
      });
      const { documentId, documentType, format, exportedBy, fileName } = exportSchema.parse(req.body);
      
      const realExportedBy = exportedBy || req.user.name || "Authenticated User";
      const realDocType = documentType || "Report";

      const entry = await prisma.exportHistory.create({
        data: { 
          documentId, 
          documentType: realDocType, 
          format, 
          exportedBy: realExportedBy, 
          fileName 
        }
      });
      await logAudit("EXPORT_GENERATE", realDocType, documentId || "multiple", req.user.id, { format, fileName });
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid export data" });
      res.status(500).json({ error: "Failed to log export" });
    }
  });

  app.get("/api/exports/history", authenticateToken, authorize(["Administrator", "EHS Manager", "EHS Engineer", "Operations Manager", "Warehouse Manager", "Site Leader"]), async (req, res) => {
    try {
      const history = await prisma.exportHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 20
      });
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch export history" });
    }
  });

  app.get("/api/reports/training-all", authenticateToken, async (req, res) => {
    try {
      const records = await prisma.trainingRecord.findMany({
        include: {
          assignment: {
            include: {
              user: { include: { role: true, department: true } },
              document: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch training records" });
    }
  });

  // TRAINING PLATFORM SYSTEM ROUTES
  app.get("/api/training/dashboard", authenticateToken, async (req, res) => {
    try {
      const now = new Date();
      const [totalAssigned, completed, overdue, expired, pendingVerification, recentRecords] = await Promise.all([
        prisma.trainingAssignment.count(),
        prisma.trainingAssignment.count({ where: { status: "completed" } }),
        prisma.trainingAssignment.count({ where: { status: "overdue" } }),
        prisma.trainingAssignment.count({ where: { status: "expired" } }),
        prisma.trainingAssignment.count({ where: { status: "pending_verification" } }),
        prisma.trainingRecord.findMany({
          take: 10,
          include: { 
            assignment: { 
              include: { user: true, document: true } 
            } 
          },
          orderBy: { createdAt: "desc" }
        })
      ]);

      const expiringSoon = await prisma.trainingAssignment.count({
        where: {
          expiresAt: {
            gt: now,
            lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      });

      const compliance = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 100;

      res.json({
        stats: {
          totalAssigned,
          completed,
          overdue,
          compliance,
          expired,
          pendingVerification,
          expiringSoon
        },
        recentCompletions: recentRecords
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch training dashboard" });
    }
  });

  app.get("/api/training/matrix", authenticateToken, async (req, res) => {
    try {
      const [roles, documents] = await Promise.all([
        prisma.role.findMany({ orderBy: { name: "asc" } }),
        prisma.document.findMany({ 
          where: { requiredTraining: true, isLatestRevision: true },
          select: { 
            id: true, 
            title: true, 
            docNumber: true,
            roleRequirements: {
              select: {
                roleId: true
              }
            }
          }
        })
      ]);

      res.json({ roles, matrix: documents });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch training matrix" });
    }
  });

  app.post("/api/training/matrix/toggle", authenticateToken, authorize(["Administrator", "Training Coordinator"]), async (req: any, res) => {
    try {
      const { roleId, documentId, required } = req.body;
      
      if (required) {
        await prisma.roleTrainingRequirement.upsert({
          where: { roleId_documentId: { roleId, documentId } },
          update: {},
          create: { roleId, documentId }
        });
        
        // Auto-assign to existing users in this role
        const users = await prisma.user.findMany({ where: { roleId } });
        for (const user of users) {
          const assignment = await prisma.trainingAssignment.upsert({
            where: { userId_documentId: { userId: user.id, documentId } },
            update: { status: "assigned" },
            create: { 
              userId: user.id, 
              documentId, 
              status: "assigned", 
              dueDate: new Date(Date.now() + 14 * 86400000) 
            }
          });
          await logAudit("TRAINING_ASSIGNMENT_CREATED", "TrainingAssignment", assignment.id, req.user.id, { roleId, documentId, userId: user.id });
        }
        await logAudit("TRAINING_REQUIREMENT_ADDED", "RoleTrainingRequirement", `${roleId}_${documentId}`, req.user.id, { roleId, documentId });
      } else {
        await prisma.roleTrainingRequirement.deleteMany({
          where: { roleId, documentId }
        });
        await logAudit("TRAINING_REQUIREMENT_REMOVED", "RoleTrainingRequirement", `${roleId}_${documentId}`, req.user.id, { roleId, documentId });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to toggle requirement" });
    }
  });

  app.get("/api/training/records/:userId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const assignments = await prisma.trainingAssignment.findMany({
        where: { userId },
        include: { 
          document: {
             select: {
               id: true, title: true, docNumber: true, requiresAcknowledgment: true, 
               requiresVerification: true, refresherFreqMonths: true
             }
          }, 
          records: { orderBy: { createdAt: "desc" } } 
        },
        orderBy: { dueDate: "asc" }
      });
      res.json(assignments);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user records" });
    }
  });

  app.post("/api/training/acknowledge/:assignmentId", authenticateToken, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      
      const assignment = await prisma.trainingAssignment.findUnique({
        where: { id: assignmentId },
        include: { document: true }
      });

      if (!assignment) return res.status(404).json({ error: "Assignment not found" });
      if (assignment.userId !== req.user.id) return res.status(403).json({ error: "You can only acknowledge your own training." });

      const needsVerification = assignment.document.requiresVerification;
      const finalStatus = needsVerification ? "pending_verification" : "completed";

      const record = await prisma.trainingRecord.create({
        data: {
          assignmentId,
          userId: req.user.id,
          documentId: assignment.documentId,
          status: finalStatus,
          acknowledged: true,
          acknowledgedAt: new Date(),
          evidencedMethod: "read_and_understood"
        }
      });

      await prisma.trainingAssignment.update({
        where: { id: assignmentId },
        data: {
          status: finalStatus,
          completedAt: needsVerification ? null : new Date(),
          expiresAt: needsVerification ? null : calculateExpiryDate(assignment.document.refresherFreqMonths)
        }
      });

      await logAudit("TRAINING_ACKNOWLEDGED", "TrainingAssignment", assignmentId, req.user.id);
      res.json(record);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to acknowledge training" });
    }
  });

  app.post("/api/training/verify/:assignmentId", authenticateToken, authorize(["Administrator", "Site Leader", "EHS Engineer", "Floor Supervisor", "Training Coordinator"]), async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const { notes } = req.body;

      const assignment = await prisma.trainingAssignment.findUnique({ 
        where: { id: assignmentId },
        include: { document: true }
      });
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });

      const record = await prisma.trainingRecord.findFirst({
        where: { assignmentId },
        orderBy: { createdAt: "desc" }
      });

      if (record) {
        await prisma.trainingRecord.update({
          where: { id: record.id },
          data: {
            status: "verified",
            supervisorVerifiedBy: req.user.name,
            supervisorVerifiedAt: new Date(),
            notes: notes || "Verified competency"
          }
        });
      }

      const updatedAssignment = await prisma.trainingAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "completed",
          completedAt: new Date(),
          expiresAt: calculateExpiryDate(assignment.document.refresherFreqMonths)
        }
      });

      await logAudit("TRAINING_VERIFIED", "TrainingAssignment", assignmentId, req.user.id, { verifier: req.user.name });
      res.json(updatedAssignment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to verify training" });
    }
  });

  // PHASES 7: AI & OLLAMA ASSISTANT
  const OLLAMA_URL = process.env.AI_OLLAMA_ENDPOINT || "http://localhost:11434";

  app.get("/api/ai/models", authenticateToken, async (req, res) => {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) throw new Error("Ollama not responding");
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(503).json({ error: "Ollama service unavailable", details: (err as any).message });
    }
  });

  app.post("/api/ai/chat", authenticateToken, authorize(["Administrator", "EHS Engineer", "Operations Manager"]), async (req: any, res) => {
    try {
      const chatSchema = z.object({
        model: z.string().optional(),
        messages: z.array(z.any()),
        stream: z.boolean().optional()
      });
      const { model, messages, stream = false } = chatSchema.parse(req.body);
      
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama3.1:8b",
          messages,
          stream
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: "Ollama Error", details: errText });
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        
        const reader = response.body?.getReader();
        if (!reader) return res.end();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        const data = await response.json();
        // Log AI usage
        await prisma.aIUsageLog.create({
          data: {
            userId: req.user?.id || "system",
            action: "chat",
            model: data.model,
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
          }
        });
        res.json(data);
      }
    } catch (err) {
      res.status(500).json({ error: "AI Generation failed", details: (err as any).message });
    }
  });

  app.get("/api/ai/prompts", authenticateToken, async (req, res) => {
    res.json(await prisma.aIPromptTemplate.findMany());
  });

  app.post("/api/ai/prompts", authenticateToken, authorize(["Administrator"]), async (req: any, res) => {
    try {
      const { name, description, template, category } = req.body;
      const p = await prisma.aIPromptTemplate.upsert({
        where: { name },
        update: { description, template, category },
        create: { name, description, template, category }
      });
      await logAudit("PROMPT_SAVE", "AIPromptTemplate", p.id, req.user?.id);
      res.json(p);
    } catch (err) {
      res.status(500).json({ error: "Failed to save prompt template" });
    }
  });

  app.get("/api/ai/usage", authenticateToken, authorize(["Administrator"]), async (req, res) => {
    res.json(await prisma.aIUsageLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }));
  });

  // ADMIN: System Health & Audit Logs
  app.get("/api/admin/audit-logs", authenticateToken, authorize(["Administrator"]), async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/admin/system-health", authenticateToken, authorize(["Administrator"]), async (req, res) => {
    try {
      const [dbStatus, aiStatus] = await Promise.all([
        prisma.$queryRaw`SELECT 1`.then(() => "Running").catch(() => "Down"),
        fetch(`${OLLAMA_URL}/api/tags`).then(r => r.ok ? "Connected" : "Service Error").catch(() => "Offline")
      ]);
      
      res.json({
        database: dbStatus,
        aiService: aiStatus,
        version: "1.9.0",
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      });
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  app.get("/api/audits/recent", authenticateToken, async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" }
      });
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Catch-all for undefined API routes (MUST be after all other /api routes)
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("System Error:", err);
    res.status(err.status || 500).json({ 
      error: "Internal server error occurred",
      message: process.env.NODE_ENV === "production" ? "Please contact support" : err.message
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️  SECURITY WARNING: Running in development mode with fallback credentials.");
    } else {
      console.log("✅ Platform running in production mode. RBAC and strict JWT validation enabled.");
    }
  });
}

startServer();
