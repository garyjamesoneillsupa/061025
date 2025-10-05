import { Router } from 'express';
import { db } from '../db';
import { jobs, drivers, customers, vehicles, jobProcessRecords } from '@shared/schema';
import { eq, and, isNotNull, desc, sql } from 'drizzle-orm';
import { FlawlessPOCService } from '../services/flawless-poc-generation';
import { generateLightPOD } from '../services/light-pod-generation';
import { authenticateToken, requireDriver, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

// Driver login endpoint - authenticates against real driver database
router.post('/login', async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ message: 'Username and PIN are required' });
    }

    // Find driver by username in the database
    const driver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.username, username))
      .limit(1);

    if (driver.length === 0) {
      return res.status(401).json({ message: 'Invalid username or PIN' });
    }

    const foundDriver = driver[0];

    // Check if PIN matches (in production, this should be hashed)
    if (foundDriver.pin !== pin) {
      return res.status(401).json({ message: 'Invalid username or PIN' });
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${foundDriver.id}:${Date.now()}`).toString('base64');

    // Return authenticated driver data
    res.json({
      driver: {
        id: foundDriver.id,
        name: foundDriver.name,
        username: foundDriver.username,
        email: foundDriver.email,
      },
      token
    });

  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ message: 'Login failed - server error' });
  }
});

// Get current driver's jobs
router.get('/current/jobs', authenticateToken, requireDriver, async (req: AuthRequest, res) => {
  try {
    // Get driver ID from authenticated token - if user is a driver, use their ID directly
    const currentDriverId = req.user?.role === 'driver' ? req.user.id : req.user?.id;
    
    if (!currentDriverId) {
      return res.status(401).json({ message: 'Driver authentication required' });
    }
    
    console.log('🔍 Fetching active jobs (assigned/collected) for driver:', currentDriverId);
    
    // Get real jobs from database filtered by CURRENT driver only - assigned and collected status only
    const driverJobs = await db
      .select({
        id: jobs.id,
        jobNumber: jobs.jobNumber,
        customerId: jobs.customerId,
        customerName: sql<string>`COALESCE(${customers.name}, 'Unknown Customer')`,
        customerPhone: sql<string>`COALESCE(${customers.phone}, '')`,
        vehicleReg: sql<string>`COALESCE(${vehicles.registration}, 'Unknown Reg')`,
        vehicleMake: sql<string>`COALESCE(${vehicles.make}, 'Unknown')`,
        vehicleModel: sql<string>`''`,
        collectionAddress: jobs.collectionAddress,
        deliveryAddress: jobs.deliveryAddress,
        collectionContact: jobs.collectionContact,
        deliveryContact: jobs.deliveryContact,
        requestedCollectionDate: jobs.requestedCollectionDate,
        requestedDeliveryDate: jobs.requestedDeliveryDate,
        status: jobs.status,
        driverId: jobs.driverId,
        createdAt: jobs.createdAt
      })
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .where(
        and(
          eq(jobs.driverId, currentDriverId),
          // Only show assigned and collected jobs - delivered jobs go to backend system
          sql`${jobs.status} IN ('assigned', 'collected')`
        )
      )
      .orderBy(desc(jobs.createdAt));

    // Transform data to expected format
    const transformedJobs = driverJobs.map(job => ({
      ...job,
      collectionAddress: typeof job.collectionAddress === 'object' 
        ? `${job.collectionAddress?.line1 || ''}, ${job.collectionAddress?.city || ''}, ${job.collectionAddress?.postcode || ''}` 
        : job.collectionAddress || '',
      deliveryAddress: typeof job.deliveryAddress === 'object' 
        ? `${job.deliveryAddress?.line1 || ''}, ${job.deliveryAddress?.city || ''}, ${job.deliveryAddress?.postcode || ''}` 
        : job.deliveryAddress || '',
      collectionContactName: job.collectionContact?.name || '',
      collectionContactPhone: job.collectionContact?.phone || '',
      deliveryContactName: job.deliveryContact?.name || '',
      deliveryContactPhone: job.deliveryContact?.phone || '',
      releaseCode: job.collectionContact?.releaseCode || null,
      modelPin: job.collectionContact?.modelPin || null,
      // Return appropriate notes based on job status
      specialInstructions: job.status === 'collected' 
        ? job.deliveryContact?.notes || null
        : job.collectionContact?.notes || null,
      collectionDate: job.requestedCollectionDate?.toISOString() || new Date().toISOString(),
      deliveryDate: job.requestedDeliveryDate?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
      updatedAt: job.createdAt?.toISOString() || new Date().toISOString()
    }));



    console.log(`Returning ${transformedJobs.length} active jobs (assigned/collected) from database`);
    res.json(transformedJobs);
  } catch (error) {
    console.error('Error fetching driver jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Submit collection data with photo uploads (including documentation photos)
router.post('/jobs/:jobId/collection', upload.fields([
  { name: 'photos', maxCount: 30 },
  { name: 'v5_document_photo', maxCount: 1 },
  { name: 'service_history_photo', maxCount: 1 },
  { name: 'locking_wheel_nut_photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { jobId } = req.params;
    const collectionData = JSON.parse(req.body.collectionData || '{}');
    
    // Get job details
    const [job] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .where(eq(jobs.id, jobId));
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get driver details safely
    const driverRecord = job.jobs.driverId ? await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, job.jobs.driverId))
      .then(records => records[0] || null) : null;
    
    // Process and save photos
    const savedPhotos: string[] = [];
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Save general photos
    if (files?.photos) {
      for (const file of files.photos) {
        const filename = `${Date.now()}_${file.originalname}`;
        const filepath = path.join(process.cwd(), 'uploads', filename);
        await fs.writeFile(filepath, file.buffer);
        savedPhotos.push(filename);
      }
    }

    // Save documentation photos with specific names
    let v5DocumentPhotoPath = '';
    let serviceHistoryPhotoPath = '';
    let lockingWheelNutPhotoPath = '';

    if (files?.v5_document_photo?.[0]) {
      const filename = `v5_doc_${Date.now()}_${files.v5_document_photo[0].originalname}`;
      const filepath = path.join(process.cwd(), 'uploads', filename);
      await fs.writeFile(filepath, files.v5_document_photo[0].buffer);
      v5DocumentPhotoPath = filepath;
    }

    if (files?.service_history_photo?.[0]) {
      const filename = `service_history_${Date.now()}_${files.service_history_photo[0].originalname}`;
      const filepath = path.join(process.cwd(), 'uploads', filename);
      await fs.writeFile(filepath, files.service_history_photo[0].buffer);
      serviceHistoryPhotoPath = filepath;
    }

    if (files?.locking_wheel_nut_photo?.[0]) {
      const filename = `locking_wheel_${Date.now()}_${files.locking_wheel_nut_photo[0].originalname}`;
      const filepath = path.join(process.cwd(), 'uploads', filename);
      await fs.writeFile(filepath, files.locking_wheel_nut_photo[0].buffer);
      lockingWheelNutPhotoPath = filepath;
    }

    // Create collection record in jobProcessRecords
    await db.insert(jobProcessRecords).values({
      jobId: jobId,
      stage: 'collection',
      mileageReading: collectionData.mileageReading || '0',
      fuelLevel: collectionData.fuelLevel || 0,
      numberOfKeys: collectionData.numberOfKeys || 1,
      v5Document: collectionData.v5Document !== '---' ? collectionData.v5Document : null,
      v5DocumentPhotoPath: v5DocumentPhotoPath || null,
      serviceHistory: collectionData.serviceHistory !== '---' ? collectionData.serviceHistory : null,
      serviceHistoryPhotoPath: serviceHistoryPhotoPath || null,
      lockingWheelNut: collectionData.lockingWheelNut !== '---' ? collectionData.lockingWheelNut : null,
      lockingWheelNutPhotoPath: lockingWheelNutPhotoPath || null,
      handoverAccepted: collectionData.handoverAccepted || false,
      photoLeftSideTaken: true,
      photoRightSideTaken: true,
      photoFrontTaken: true,
      photoBackTaken: true,
      photoDashboardTaken: true,
      photoKeysTaken: true,
      additionalNotes: collectionData.additionalNotes || '',
      customerName: collectionData.contactMet || '',
      inspectionData: JSON.stringify({
        damagePoints: collectionData.damagePoints || [],
        allPhotos: savedPhotos
      })
    });

    // Update job status to collected
    await db
      .update(jobs)
      .set({ 
        status: 'collected',
        collectedAt: new Date()
      })
      .where(eq(jobs.id, jobId));

    // Generate POC document with FlawlessPOCService
    try {
      // Get vehicle data
      const vehicleRecord = job.jobs.vehicleId ? await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, job.jobs.vehicleId))
        .then(records => records[0] || null) : null;

      // Map collection data to FlawlessPOCService format
      const goldStandardData = {
        jobReference: job.jobs.jobNumber,
        vehicleRegistration: vehicleRecord?.registration || 'Unknown',
        make: vehicleRecord?.make || 'Unknown',
        model: 'Unknown', // Model not in vehicle schema
        vin: 'N/A', // VIN not in vehicle schema
        mileageAtCollection: collectionData.mileageReading || '0',
        fuelLevel: collectionData.fuelLevel || 0,
        dateTime: new Date().toISOString(),
        collectionLocation: typeof job.jobs.collectionAddress === 'object' 
          ? `${job.jobs.collectionAddress.line1 || ''}, ${job.jobs.collectionAddress.city || ''}, ${job.jobs.collectionAddress.postcode || ''}` 
          : job.jobs.collectionAddress || '',
        gpsCoordinates: collectionData.gpsCoordinates || undefined,
        
        damageMarkers: (collectionData.damagePoints || []).map((dm: any, idx: number) => ({
          id: dm.id || `damage-${idx}`,
          view: dm.view || 'front',
          position: dm.position || { x: 50, y: 50 },
          damageType: dm.type || 'scratch',
          damageSize: dm.size || 'small',
          photoUrls: dm.photos || [],
          label: idx + 1,
          description: dm.description || ''
        })),
        
        interiorConditionNotes: collectionData.interiorNotes || '',
        interiorPhotos: [],
        wheelsPhotos: [],
        wheelConditionNotes: '',
        glassCondition: 'OK',
        glassPhotos: [],
        
        allExteriorPhotos: {
          front: collectionData.exteriorPhotos?.front || [],
          driverSide: collectionData.exteriorPhotos?.driverSide || [],
          rear: collectionData.exteriorPhotos?.rear || [],
          passengerSide: collectionData.exteriorPhotos?.passengerSide || [],
          roof: []
        },
        
        categorizedInteriorPhotos: {
          dashboard: collectionData.interiorPhotos?.dashboard || [],
          frontSeats: collectionData.interiorPhotos?.frontSeats || [],
          rearSeats: collectionData.interiorPhotos?.rearSeats || [],
          bootTrunk: collectionData.interiorPhotos?.bootTrunk || []
        },
        
        wheelAssessment: {
          frontLeft: {
            scuffed: collectionData.wheels?.frontLeft?.scuffed || false,
            tyreCondition: (collectionData.wheels?.frontLeft?.tyreCondition || 'OK') as "OK" | "Worn" | "Extremely Worn",
            photos: collectionData.wheels?.frontLeft?.photos || []
          },
          frontRight: {
            scuffed: collectionData.wheels?.frontRight?.scuffed || false,
            tyreCondition: (collectionData.wheels?.frontRight?.tyreCondition || 'OK') as "OK" | "Worn" | "Extremely Worn",
            photos: collectionData.wheels?.frontRight?.photos || []
          },
          rearLeft: {
            scuffed: collectionData.wheels?.rearLeft?.scuffed || false,
            tyreCondition: (collectionData.wheels?.rearLeft?.tyreCondition || 'OK') as "OK" | "Worn" | "Extremely Worn",
            photos: collectionData.wheels?.rearLeft?.photos || []
          },
          rearRight: {
            scuffed: collectionData.wheels?.rearRight?.scuffed || false,
            tyreCondition: (collectionData.wheels?.rearRight?.tyreCondition || 'OK') as "OK" | "Worn" | "Extremely Worn",
            photos: collectionData.wheels?.rearRight?.photos || []
          }
        },
        
        fuelLevelPhotos: collectionData.fuelPhotos || [],
        
        numberOfKeys: collectionData.numberOfKeys || 1,
        keysPhotoUrl: collectionData.keyPhotos?.[0] || '',
        v5LogbookPhotoUrl: collectionData.v5Photos?.[0] || '',
        serviceBookPhotoUrl: collectionData.serviceBookPhotos?.[0] || '',
        lockingWheelNutPhotoUrl: collectionData.lockingWheelNutPhotos?.[0] || '',
        otherDocuments: [],
        
        documentProvisionStatus: {
          v5Provided: collectionData.v5Document !== '---' ? (collectionData.v5Document === 'Yes') : null,
          serviceBookProvided: collectionData.serviceHistory !== '---' ? (collectionData.serviceHistory === 'Yes') : null,
          lockingWheelNutProvided: collectionData.lockingWheelNut !== '---' ? (collectionData.lockingWheelNut === 'Yes') : null
        },
        
        weather: (collectionData.weather || 'dry') as "dry" | "wet",
        vehicleCleanliness: (collectionData.vehicleCleanliness || 'clean') as "clean" | "dirty",
        lightingConditions: (collectionData.lightingConditions || 'light') as "light" | "dark",
        
        customerFullName: collectionData.contactMet || job.customers?.name || 'Customer',
        customerSignature: collectionData.customerSignature || '',
        customerNotes: collectionData.customerNotes || '',
        driverAdditionalNotes: collectionData.additionalNotes || '',
        driverName: driverRecord?.name || 'Driver'
      };

      const pocBuffer = await FlawlessPOCService.generatePOC(goldStandardData);

      console.log(`✅ POC generated for job ${job.jobs.jobNumber}, size: ${pocBuffer.length} bytes`);
      
      res.json({ 
        success: true, 
        message: 'Collection completed successfully with professional POC generated',
        pocGenerated: true,
        documentationComplete: {
          v5Document: collectionData.v5Document !== '---',
          serviceHistory: collectionData.serviceHistory !== '---',
          lockingWheelNut: collectionData.lockingWheelNut !== '---',
          photosEmbedded: savedPhotos.length > 0
        }
      });
    } catch (pocError) {
      console.error('❌ POC generation failed:', pocError);
      res.json({ 
        success: true, 
        message: 'Collection completed but POC generation failed',
        pocGenerated: false,
        error: pocError instanceof Error ? pocError.message : String(pocError)
      });
    }
    
  } catch (error) {
    console.error('Error processing collection:', error);
    res.status(500).json({ error: 'Failed to process collection' });
  }
});

// Submit delivery data and generate POD
router.post('/jobs/:jobId/delivery', async (req, res) => {
  try {
    const { jobId } = req.params;
    const deliveryData = req.body;
    
    // Get job details with collection data
    const [job] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .where(eq(jobs.id, jobId));
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get driver details
    const driverRecord = job.jobs.driverId ? await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, job.jobs.driverId))
      .then(records => records[0] || null) : null;
    
    // Update job status to delivered
    await db
      .update(jobs)
      .set({ 
        status: 'delivered',
        deliveredAt: new Date()
      })
      .where(eq(jobs.id, jobId));

    // Generate POD document  
    try {
      // Get collection records for POD generation
      const processRecords = await db
        .select()
        .from(jobProcessRecords)
        .where(eq(jobProcessRecords.jobId, jobId));
      
      const collectionRecord = processRecords.find(r => r.stage === 'collection');
      
      const podBuffer = await generateLightPOD(
        {
          id: job.jobs.id,
          jobNumber: job.jobs.jobNumber,
          customerId: job.jobs.customerId || '',
          customerName: job.customers?.name || 'Unknown Customer',
          vehicleReg: 'TBD',
          vehicleMake: 'TBD',
          vehicleModel: 'TBD',
          collectionDate: job.jobs.requestedCollectionDate?.toISOString() || new Date().toISOString(),
          deliveryDate: job.jobs.requestedDeliveryDate?.toISOString() || new Date().toISOString(),
          collectionAddress: typeof job.jobs.collectionAddress === 'object' 
            ? `${job.jobs.collectionAddress?.line1 || ''}, ${job.jobs.collectionAddress?.city || ''}` 
            : job.jobs.collectionAddress || '',
          deliveryAddress: typeof job.jobs.deliveryAddress === 'object'
            ? `${job.jobs.deliveryAddress?.line1 || ''}, ${job.jobs.deliveryAddress?.city || ''}` 
            : job.jobs.deliveryAddress || '',
          status: job.jobs.status
        } as any,
        {
          name: driverRecord?.name || 'Driver',
          email: driverRecord?.email,
          phone: driverRecord?.phone,
        },
        deliveryData,
        collectionRecord || null
      );

      // In a real implementation, save the POD to file storage/S3
      console.log(`Generated POD for job ${job.jobs.jobNumber}, size: ${podBuffer.length} bytes`);
      
      res.json({ 
        success: true, 
        message: 'Delivery completed and POD generated',
        podGenerated: true
      });
    } catch (podError) {
      console.error('POD generation failed:', podError);
      res.json({ 
        success: true, 
        message: 'Delivery completed but POD generation failed',
        podGenerated: false
      });
    }
    
  } catch (error) {
    console.error('Error processing delivery:', error);
    res.status(500).json({ error: 'Failed to process delivery' });
  }
});

// Get specific job details
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const [job] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .where(eq(jobs.id, jobId));
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

export default router;