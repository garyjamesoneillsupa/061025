import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function registerAutoSaveRoutes(app: Express) {
  // Save collection draft data - OPTIMIZED
  app.post('/api/jobs/:jobId/auto-save', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { collectionData, currentStep } = req.body;

      if (!collectionData || !currentStep) {
        return res.status(400).json({ error: 'Missing collectionData or currentStep' });
      }

      // Pre-serialize JSON to avoid doing it twice
      const serializedData = JSON.stringify(collectionData);
      const now = new Date();

      // Use faster, non-blocking approach
      setImmediate(async () => {
        try {
          await db.execute(sql`
            INSERT INTO collection_drafts (job_id, collection_data, current_step, last_saved)
            VALUES (${jobId}, ${serializedData}, ${currentStep}, ${now})
            ON CONFLICT (job_id) 
            DO UPDATE SET 
              collection_data = ${serializedData},
              current_step = ${currentStep},
              last_saved = ${now}
          `);
        } catch (error) {
          console.error('Background auto-save failed:', error);
        }
      });

      // Respond immediately
      res.json({ 
        success: true,
        message: 'Auto-save queued',
        timestamp: now.toISOString()
      });

    } catch (error) {
      console.error('Auto-save failed:', error);
      res.status(500).json({ error: 'Auto-save failed' });
    }
  });

  // Restore collection draft data
  app.get('/api/jobs/:jobId/auto-save', async (req, res) => {
    try {
      const { jobId } = req.params;

      const result = await db.execute(sql`
        SELECT collection_data, current_step, last_saved
        FROM collection_drafts 
        WHERE job_id = ${jobId}
      `);

      if (result.rows.length === 0) {
        return res.json({ exists: false });
      }

      const draft = result.rows[0] as any;
      
      res.json({
        exists: true,
        collectionData: draft.collection_data,
        currentStep: draft.current_step,
        lastSaved: draft.last_saved
      });

    } catch (error) {
      console.error('Auto-save restore failed:', error);
      res.status(500).json({ error: 'Failed to restore auto-save data' });
    }
  });

  // Save delivery draft data - OPTIMIZED
  app.post('/api/jobs/:jobId/delivery-auto-save', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { deliveryData, currentStep } = req.body;

      if (!deliveryData || !currentStep) {
        return res.status(400).json({ error: 'Missing deliveryData or currentStep' });
      }

      // Pre-serialize JSON to avoid doing it twice
      const serializedData = JSON.stringify(deliveryData);
      const now = new Date();

      // Use faster, non-blocking approach
      setImmediate(async () => {
        try {
          await db.execute(sql`
            INSERT INTO delivery_drafts (job_id, delivery_data, current_step, last_saved)
            VALUES (${jobId}, ${serializedData}, ${currentStep}, ${now})
            ON CONFLICT (job_id) 
            DO UPDATE SET 
              delivery_data = ${serializedData},
              current_step = ${currentStep},
              last_saved = ${now}
          `);
        } catch (error) {
          console.error('Background delivery auto-save failed:', error);
        }
      });

      // Respond immediately
      res.json({ 
        success: true,
        message: 'Delivery auto-save queued',
        timestamp: now.toISOString()
      });

    } catch (error) {
      console.error('Delivery auto-save failed:', error);
      res.status(500).json({ error: 'Delivery auto-save failed' });
    }
  });

  // Restore delivery draft data
  app.get('/api/jobs/:jobId/delivery-auto-save', async (req, res) => {
    try {
      const { jobId } = req.params;

      const result = await db.execute(sql`
        SELECT delivery_data, current_step, last_saved
        FROM delivery_drafts 
        WHERE job_id = ${jobId}
      `);

      if (result.rows.length === 0) {
        return res.json({ exists: false });
      }

      const draft = result.rows[0] as any;
      
      res.json({
        exists: true,
        deliveryData: draft.delivery_data,
        currentStep: draft.current_step,
        lastSaved: draft.last_saved
      });

    } catch (error) {
      console.error('Delivery auto-save restore failed:', error);
      res.status(500).json({ error: 'Failed to restore delivery auto-save data' });
    }
  });

  // Clear collection draft (when job is completed)
  app.delete('/api/jobs/:jobId/auto-save', async (req, res) => {
    try {
      const { jobId } = req.params;

      await db.execute(sql`
        DELETE FROM collection_drafts WHERE job_id = ${jobId}
      `);

      res.json({ success: true, message: 'Auto-save data cleared' });

    } catch (error) {
      console.error('Auto-save clear failed:', error);
      res.status(500).json({ error: 'Failed to clear auto-save data' });
    }
  });

  // List all draft jobs (for debugging/admin)
  app.get('/api/auto-save/drafts', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT cd.job_id, cd.current_step, cd.last_saved, j.job_number, j.status
        FROM collection_drafts cd
        LEFT JOIN jobs j ON cd.job_id = j.id
        ORDER BY cd.last_saved DESC
      `);

      res.json(result.rows);

    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      res.status(500).json({ error: 'Failed to fetch draft data' });
    }
  });
}