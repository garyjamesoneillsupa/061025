import express from "express";
import multer from "multer";
// import sharp from "sharp";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { expenses, drivers, jobs, customers } from "@shared/schema";
import { eq, and } from "drizzle-orm";
// Import will be handled below in the route
import { EmailService } from "../services/email";

const router = express.Router();

// Configure multer for expense receipt uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Create expense submission - SIMPLIFIED
router.post("/", upload.single("receiptPhoto"), async (req, res) => {
  try {
    const { 
      jobId, 
      driverId, 
      type, 
      amount,
      description,
      stage
    } = req.body;

    // Simplified validation - only require core fields
    if (!jobId || !driverId || !type || !amount) {
      return res.status(400).json({ 
        message: "Missing required fields: jobId, driverId, type, amount" 
      });
    }

    // Validate description for "other" type
    if (type === 'other' && !description) {
      return res.status(400).json({ 
        message: "Description is required for 'other' expense type" 
      });
    }

    // Require receipt photo
    if (!req.file) {
      return res.status(400).json({ 
        message: "Receipt photo is required" 
      });
    }

    // Get job details with vehicle info
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: {
        vehicle: true
      }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Auto-populate fuel type from DVLA data for fuel expenses
    let autoFuelType = null;
    if (type === 'fuel' && job.vehicle?.fuelType) {
      autoFuelType = job.vehicle.fuelType.toLowerCase();
      console.log(`⛽ Auto-populated fuel type from DVLA: ${autoFuelType}`);
    }

    // Parse amount
    const parsedAmount = parseFloat(amount);

    // Get vehicle registration from job data
    const vehicleReg = job.vehicle?.registration || job.jobNumber;

    // Save receipt photo with watermark
    const { FileStorageService } = await import('../services/fileStorage');
    const saveResult = await FileStorageService.saveExpenseReceipt(
      job.jobNumber,
      type,
      vehicleReg,
      req.file.buffer,
      stage as 'collection' | 'delivery' || 'collection'
    );

    // Create simplified expense record
    const [newExpense] = await db
      .insert(expenses)
      .values({
        jobId,
        driverId,
        type: type as "fuel" | "train" | "bus" | "taxi" | "other",
        category: type, // Use type as category for simplicity
        fuelType: autoFuelType,
        description: description || null,
        amount: parsedAmount.toFixed(2),
        receiptPhotoPath: saveResult.filePath,
        stage: stage || 'expenses',
        purchasedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    console.log(`✅ Expense created: ${type} - £${parsedAmount.toFixed(2)} for job ${job.jobNumber}`);

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create expense" 
    });
  }
});

// Get all expenses (for admin expenses page)
router.get("/", async (req, res) => {
  try {
    const allExpenses = await db
      .select({
        id: expenses.id,
        type: expenses.type,
        jobId: expenses.jobId,
        driverId: expenses.driverId,
        driverName: drivers.name,
        item: expenses.type,
        amount: expenses.amount,
        notes: expenses.notes,
        fuelType: expenses.fuelType,
        receiptPhotoPath: expenses.receiptPhotoPath,
        isApproved: expenses.isApproved,
        chargeToCustomer: expenses.chargeToCustomer,
        submittedAt: expenses.submittedAt,
        approvedAt: expenses.approvedAt,
        jobNumber: jobs.jobNumber,
        customerName: customers.name,
      })
      .from(expenses)
      .leftJoin(drivers, eq(expenses.driverId, drivers.id))
      .leftJoin(jobs, eq(expenses.jobId, jobs.id))
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .orderBy(expenses.submittedAt);

    // Transform to match expected format
    const formattedExpenses = allExpenses.map(exp => ({
      ...exp,
      job: {
        jobNumber: exp.jobNumber,
        customer: {
          name: exp.customerName
        }
      }
    }));

    res.json(formattedExpenses);
  } catch (error) {
    console.error("Error fetching all expenses:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

// Get expenses for a job
router.get("/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.jobId, jobId))
      .orderBy(expenses.submittedAt);

    res.json(jobExpenses);
  } catch (error) {
    console.error("Error fetching job expenses:", error);
    res.status(500).json({ message: "Failed to fetch job expenses" });
  }
});

// Get expenses for a driver
router.get("/driver/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const driverExpenses = await db
      .select({
        id: expenses.id,
        jobNumber: jobs.jobNumber,
        type: expenses.type,
        amount: expenses.amount,
        notes: expenses.notes,
        isApproved: expenses.isApproved,
        chargeToCustomer: expenses.chargeToCustomer,
        submittedAt: expenses.submittedAt,
        approvedAt: expenses.approvedAt,
      })
      .from(expenses)
      .leftJoin(jobs, eq(expenses.jobId, jobs.id))
      .where(eq(expenses.driverId, driverId))
      .orderBy(expenses.submittedAt);

    res.json(driverExpenses);
  } catch (error) {
    console.error("Error fetching driver expenses:", error);
    res.status(500).json({ message: "Failed to fetch driver expenses" });
  }
});

// Approve/reject expense (admin only)
router.patch("/:expenseId/approve", async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { isApproved, chargeToCustomer } = req.body;

    const [updatedExpense] = await db
      .update(expenses)
      .set({
        isApproved: Boolean(isApproved),
        chargeToCustomer: chargeToCustomer !== null && chargeToCustomer !== undefined ? Boolean(chargeToCustomer) : null,
        approvedAt: new Date(),
        approvedBy: "admin", // This should be the actual admin user ID
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
});

// Get receipt photo
router.get("/:expenseId/receipt", async (req, res) => {
  try {
    const { expenseId } = req.params;

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    if (!expense || !expense.receiptPhotoPath) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const photoPath = path.resolve(expense.receiptPhotoPath);
    
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ message: "Receipt file not found" });
    }

    // Set proper content type for image display
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(photoPath);
  } catch (error) {
    console.error("Error serving receipt photo:", error);
    res.status(500).json({ message: "Failed to serve receipt photo" });
  }
});

export default router;