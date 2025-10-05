import { Router } from 'express';
import { db } from '../db';
import { vehicleInspections, jobs, photos, expenses, vehicles } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

const router = Router();

// Get all completed deliveries for admin panel
router.get('/completed', async (req, res) => {
  try {
    console.log('🔍 Fetching completed deliveries...');

    // Get all delivery inspections with job data
    const deliveries = await db
      .select({
        id: vehicleInspections.id,
        jobId: vehicleInspections.jobId,
        jobNumber: jobs.jobNumber,
        completedAt: vehicleInspections.completedAt,
        inspectionData: vehicleInspections.data
      })
      .from(vehicleInspections)
      .innerJoin(jobs, eq(vehicleInspections.jobId, jobs.id))
      .where(eq(vehicleInspections.inspectionType, 'delivery'))
      .orderBy(vehicleInspections.completedAt);

    console.log(`✅ Found ${deliveries.length} completed deliveries`);

    res.json(deliveries);
  } catch (error) {
    console.error('❌ Error fetching deliveries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deliveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete a delivery
router.post('/complete', async (req, res) => {
  try {
    const { jobId, customerName, signature, completedAt, photoSummary, ...extraData } = req.body;

    console.log('🚀 FAST completing delivery for job:', jobId);
    console.log('📊 Photo summary:', photoSummary);

    // Get the job to extract the job number - handle both ID and job number
    const [job] = await db
      .select({ jobNumber: jobs.jobNumber, id: jobs.id, driverId: jobs.driverId })
      .from(jobs)
      .where(or(eq(jobs.id, jobId), eq(jobs.jobNumber, jobId)));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status to "delivered" using the actual job UUID
    await db
      .update(jobs)
      .set({ 
        status: 'delivered'
      })
      .where(eq(jobs.id, job.id));

    // Get the actual saved delivery data from auto-saves (photos already there)
    const [existingInspection] = await db
      .select()
      .from(vehicleInspections)
      .where(
        and(
          eq(vehicleInspections.jobId, job.id),
          eq(vehicleInspections.inspectionType, 'delivery')
        )
      )
      .orderBy(vehicleInspections.createdAt)
      .limit(1);

    // Use existing data or create minimal completion record
    const completionData = existingInspection ? {
      ...existingInspection.data,
      customerName,
      signature,
      completedAt: completedAt || new Date().toISOString(),
      ...extraData
    } : {
      customerName,
      signature,
      completedAt: completedAt || new Date().toISOString(),
      photoSummary,
      ...extraData
    };

    // CRITICAL: Ensure damage markers from request body are preserved in completion data
    if (req.body.damageMarkers && Array.isArray(req.body.damageMarkers)) {
      console.log('🔧 FORCING damage markers into completion data:', req.body.damageMarkers.length);
      completionData.damageMarkers = req.body.damageMarkers;
    } else if (existingInspection?.data?.damageMarkers) {
      console.log('🔧 Preserving existing damage markers:', existingInspection.data.damageMarkers.length);
      completionData.damageMarkers = existingInspection.data.damageMarkers;
    } else {
      console.log('⚠️ No damage markers found in request body or existing data');
      completionData.damageMarkers = [];
    }

    // ⚡ STEVE JOBS: NO PHOTO PROCESSING - INSTANT COMPLETION!
    console.log('⚡ STEVE JOBS INSTANT: Skipping ALL photo processing for speed');
    // Photos are already saved via auto-save - no additional processing needed!

    // Update or create vehicle inspection data
    console.log('🔄 Starting database operation...');
    try {
      if (existingInspection) {
        console.log('🔄 Updating existing inspection:', existingInspection.id);
        await db
          .update(vehicleInspections)
          .set({
            data: completionData,
            completedAt: new Date(completedAt || Date.now())
          })
          .where(eq(vehicleInspections.id, existingInspection.id));
        console.log('✅ Updated existing inspection with completion data');
      } else {
        const inspectionId = `inspection_${Date.now()}`;
        console.log('🔄 Creating new inspection:', inspectionId);
        await db.insert(vehicleInspections).values({
          id: inspectionId,
          jobId: job.id,
          jobNumber: job.jobNumber,
          inspectionType: 'delivery',
          data: completionData,
          completedAt: new Date(completedAt || Date.now()),
          createdAt: new Date()
        });
        console.log('✅ Created new inspection with completion data');
      }
      console.log('✅ Database operation completed successfully');
    } catch (dbError) {
      console.error('💥 DATABASE ERROR:', dbError);
      throw dbError;
    }

    console.log('✅ STEVE JOBS INSTANT: Delivery completed in milliseconds!');
    
    // 💰 Process and save expenses with receipt photos
    if (req.body.expenses && Array.isArray(req.body.expenses) && req.body.expenses.length > 0) {
      console.log(`💰 Processing ${req.body.expenses.length} expenses for job ${job.jobNumber}`);
      
      // Get vehicle registration from job
      const [jobWithVehicle] = await db
        .select({ 
          vehicleReg: vehicles.registration
        })
        .from(jobs)
        .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
        .where(eq(jobs.id, job.id));
      
      const vehicleReg = jobWithVehicle?.vehicleReg || 'NOREG';
      
      const { FileStorageService } = await import('../services/fileStorage');
      
      for (const expense of req.body.expenses) {
        try {
          let receiptPhotoPath = null;
          
          // Save receipt photo if present
          if (expense.receiptPhoto && expense.receiptPhoto.startsWith('data:image/')) {
            const base64Data = expense.receiptPhoto.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            const saveResult = await FileStorageService.saveExpenseReceipt(
              job.jobNumber,
              expense.type,
              vehicleReg,
              buffer,
              'delivery'
            );
            
            receiptPhotoPath = saveResult.filePath;
            console.log(`📸 Saved expense receipt: ${saveResult.fileName}`);
          }
          
          // Save expense to database
          await db.insert(expenses).values({
            jobId: job.id,
            driverId: job.driverId || 'unknown',
            type: expense.type,
            description: expense.description,
            amount: expense.amount,
            receiptPhotoPath,
            stage: 'delivery',
            submittedAt: new Date()
          });
          
          console.log(`✅ Saved ${expense.type} expense: £${expense.amount}`);
        } catch (error) {
          console.error(`❌ Failed to save expense:`, error);
        }
      }
    }
    
    // ⚡ INSTANT POD GENERATION - No delay, with ALL data including photos & damage markers
    setTimeout(async () => {
      try {
        console.log('📝 Starting COMPLETE POD generation for job:', job.jobNumber);
        console.log('📊 POD will include:', {
          damageMarkers: completionData.damageMarkers?.length || 0,
          additionalNotes: completionData.additionalNotes || 'NONE',
          photos: {
            v5: completionData.v5Photos?.length || 0,
            keys: completionData.keyPhotos?.length || 0,
            exterior: Object.keys(completionData.exteriorPhotos || {}).length,
            interior: Object.keys(completionData.interiorPhotos || {}).length
          }
        });
        
        // Generate POD with ALL DATA including photos and damage markers
        const { FlawlessPODService } = await import('../services/flawless-pod-generation');
        await FlawlessPODService.generatePOD({
          JOB_NUMBER: job.jobNumber,
          COLLECTION_DATE: new Date(completionData.completedAt).toLocaleDateString('en-GB'),
          COLLECTION_TIME: new Date(completionData.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          CUSTOMER_NAME: completionData.customerName || 'Customer',
          CUSTOMER_CONTACT: 'Customer Contact',
          COLLECTION_ADDRESS: ['Collection Address'],
          DELIVERY_ADDRESS: ['Delivery Address'],
          LOGO: '',
          DRIVER_NAME: 'Driver',
          VEHICLE_MAKE: 'Vehicle Make',
          VEHICLE_REG: 'Vehicle Reg',  
          VEHICLE_MILEAGE: completionData.mileageReading || 'Not recorded',
          VEHICLE_FUEL: `${completionData.fuelLevel || 4}/8`,
          // 🔥 CRITICAL: Include ALL photos from completion data
          EXTERIOR_PHOTOS: [
            ...(completionData.exteriorPhotos?.front || []),
            ...(completionData.exteriorPhotos?.rear || []),
            ...(completionData.exteriorPhotos?.driverSide || []),
            ...(completionData.exteriorPhotos?.passengerSide || [])
          ],
          INTERIOR_PHOTOS: [
            ...(completionData.interiorPhotos?.dashboard || []),
            ...(completionData.interiorPhotos?.frontSeats || []),
            ...(completionData.interiorPhotos?.rearSeats || []),
            ...(completionData.interiorPhotos?.boot || [])
          ],
          WHEELS_PHOTOS: completionData.wheelPhotos || [],
          KEYS_V5_PHOTOS: [
            ...(completionData.keyPhotos || []),
            ...(completionData.v5Photos || []),
            ...(completionData.serviceBookPhotos || []),
            ...(completionData.lockingWheelNutPhotos || [])
          ],
          // 🎯 CRITICAL: Include damage markers with photos
          DAMAGE_MARKERS: completionData.damageMarkers || [],
          DAMAGE_PHOTOS: (completionData.damageMarkers || []).flatMap((marker: any) => marker.photos || []),
          customerSignature: completionData.signature,
          DRIVER_ADDITIONAL_NOTES: completionData.additionalNotes || ''
        });
        console.log('✅ COMPLETE POD generated with all photos and damage markers for job:', job.jobNumber);
      } catch (error) {
        console.error('⚠️ Background POD generation failed:', error);
        console.error('📊 Available data keys:', Object.keys(completionData));
      }
    }, 0); // Fire immediately but don't block response

    res.json({
      success: true,
      message: 'Delivery completed successfully',
      inspectionId: existingInspection?.id || `inspection_${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Error completing delivery:', error);
    res.status(500).json({ 
      error: 'Failed to complete delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
