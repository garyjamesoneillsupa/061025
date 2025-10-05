import type { Express } from "express";
import multer from 'multer';
import { ObjectStorageService } from '../objectStorage';
import { storage } from '../storage';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export function registerCollectionRoutes(app: Express) {
  const objectStorageService = new ObjectStorageService();

  // Get upload URL for job file
  app.post('/api/jobs/:jobId/upload-url', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { fileName } = req.body;

      if (!fileName) {
        return res.status(400).json({ error: 'fileName is required' });
      }

      const uploadURL = await objectStorageService.getJobFileUploadURL(jobId, fileName);
      
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  // Upload job file directly to server (fallback)
  app.post('/api/jobs/:jobId/upload', upload.single('file'), async (req, res) => {
    try {
      const { jobId } = req.params;
      const { fileName } = req.body;
      const file = req.file;

      if (!file || !fileName) {
        return res.status(400).json({ error: 'File and fileName are required' });
      }

      const filePath = await objectStorageService.uploadJobFile(
        jobId,
        fileName,
        file.buffer,
        file.mimetype
      );

      res.json({ filePath, fileName });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Get job file
  app.get('/api/jobs/:jobId/files/:fileName', async (req, res) => {
    try {
      const { jobId, fileName } = req.params;
      
      const file = await objectStorageService.getJobFile(jobId, fileName);
      await objectStorageService.downloadFile(file, res);
    } catch (error) {
      console.error('Error getting file:', error);
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Submit collection workflow data
  app.post('/api/jobs/:jobId/collection', async (req, res) => {
    try {
      const { jobId } = req.params;
      const {
        v5Present,
        serviceHistoryPresent,
        lockingWheelNutPresent,
        mileageReading,
        fuelLevel,
        vehicleCleanExternally,
        vehicleCleanInternally,
        vehicleFreeDamageExternally,
        vehicleFreeDamageInternally,
        isWet,
        isDark,
        customerSignature,
        additionalNotes,
        numberOfKeys = 1
      } = req.body;

      // Create job process record
      const processRecord = await storage.createJobProcessRecord({
        jobId,
        stage: 'collection',
        v5Present: v5Present || false,
        serviceHistoryPresent: serviceHistoryPresent || false,
        lockingWheelNutPresent: lockingWheelNutPresent || false,
        mileageReading: mileageReading || '0',
        fuelLevel: fuelLevel || 4,
        vehicleCleanExternally: vehicleCleanExternally || true,
        vehicleCleanInternally: vehicleCleanInternally || true,
        vehicleFreeDamageExternally: vehicleFreeDamageExternally || true,
        vehicleFreeDamageInternally: vehicleFreeDamageInternally || true,
        isWet: isWet || false,
        isDark: isDark || false,
        customerSignature: customerSignature || '',
        additionalNotes: additionalNotes || '',
        numberOfKeys: numberOfKeys
      });

      // Update job status to collected
      await storage.updateJobStatus(jobId, 'collected');

      res.json({
        success: true,
        processRecord,
        message: 'Collection data saved successfully'
      });

    } catch (error) {
      console.error('Error saving collection data:', error);
      res.status(500).json({ 
        error: 'Failed to save collection data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get driver jobs
  app.get('/api/driver/:driverId/jobs', async (req, res) => {
    try {
      const { driverId } = req.params;
      const jobs = await storage.getJobsByDriver(driverId);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching driver jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // List job files
  app.get('/api/jobs/:jobId/files', async (req, res) => {
    try {
      const { jobId } = req.params;
      
      const files = await objectStorageService.listJobFiles(jobId);
      res.json({ files });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // ⚡ LIGHTNING FAST: Complete collection using auto-saved data (no massive payload!)
  app.post('/api/jobs/:jobId/complete-collection', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { signature, completedAt } = req.body; // Only need signature!

      console.log('⚡ FAST COMPLETION: Starting for job', jobId);

      // Validate job exists and is in correct state
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status !== 'assigned') {
        return res.status(400).json({ error: `Job is not in assigned status (current: ${job.status})` });
      }

      // ⚡ RETRIEVE AUTO-SAVED DATA from collection_drafts table
      const draftResult = await db.execute(sql`
        SELECT collection_data 
        FROM collection_drafts 
        WHERE job_id = ${jobId}
      `);

      if (draftResult.rows.length === 0) {
        return res.status(400).json({ error: 'No auto-saved collection data found. Please retry collection.' });
      }

      const collectionData = (draftResult.rows[0] as any).collection_data;
      console.log('✅ Retrieved auto-saved data from database');

      // Override signature if provided in completion request (final signature)
      if (signature) {
        collectionData.signature = signature;
      }

      // Create collection process record from auto-saved data
      const processRecord = {
        jobId,
        stage: 'collection' as const,
        type: 'collection' as const,
        arrivalTime: completedAt || new Date().toISOString(),
        
        // Documentation flags from auto-saved data
        v5Present: collectionData.v5Provided || false,
        serviceHistoryPresent: collectionData.serviceBookProvided || false,
        lockingWheelNutPresent: collectionData.lockingWheelNutProvided || false,
        
        // Vehicle condition from auto-saved data
        mileageReading: collectionData.odometerReading || '0',
        fuelLevel: collectionData.fuelLevel || 4,
        vehicleCleanExternally: collectionData.vehicleCleanliness === 'clean',
        vehicleCleanInternally: true,
        vehicleFreeDamageExternally: !collectionData.damageMarkers || collectionData.damageMarkers.length === 0,
        vehicleFreeDamageInternally: true,
        
        // Environmental conditions from auto-saved data
        isWet: collectionData.weatherConditions === 'wet',
        isDark: collectionData.lightingConditions === 'dark',
        
        // Customer details from auto-saved data
        customerSignature: collectionData.signature || signature || '',
        additionalNotes: collectionData.additionalNotes || '',
        numberOfKeys: collectionData.numberOfKeys || 1,
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage.createJobProcessRecord(processRecord);
      console.log('✅ Process record created');

      // ⚡ Process and upload photos from auto-saved data
      const metadata: any = {
        collectionTime: completedAt || new Date().toISOString(),
        customerName: collectionData.customerName || 'Unknown',
        additionalNotes: collectionData.additionalNotes || '',
        documentation: {},
        vehicleViews: {},
        customerSignature: null,
        damagePhotos: {},
        interiorPhotos: {},
        wheelPhotos: {}
      };

      // Helper function to upload base64 photo
      const uploadPhoto = async (photoData: string, filename: string, mimeType = 'image/jpeg') => {
        if (!photoData) return null;
        try {
          const base64Data = photoData.includes(',') ? photoData.split(',')[1] : photoData;
          const buffer = Buffer.from(base64Data, 'base64');
          await objectStorageService.uploadJobFile(jobId, filename, buffer, mimeType);
          return filename;
        } catch (error) {
          console.error(`Failed to upload ${filename}:`, error);
          return null;
        }
      };

      // Upload V5 photos
      if (collectionData.v5Photos && collectionData.v5Photos.length > 0) {
        for (let i = 0; i < collectionData.v5Photos.length; i++) {
          const filename = await uploadPhoto(collectionData.v5Photos[i], `v5-${i}.jpg`);
          if (filename) metadata.documentation[`v5_${i}`] = filename;
        }
      }

      // Upload keys photos
      if (collectionData.keyPhotos && collectionData.keyPhotos.length > 0) {
        for (let i = 0; i < collectionData.keyPhotos.length; i++) {
          const filename = await uploadPhoto(collectionData.keyPhotos[i], `keys-${i}.jpg`);
          if (filename) metadata.documentation[`keys_${i}`] = filename;
        }
      }

      // Upload service book photos
      if (collectionData.serviceBookPhotos && collectionData.serviceBookPhotos.length > 0) {
        for (let i = 0; i < collectionData.serviceBookPhotos.length; i++) {
          const filename = await uploadPhoto(collectionData.serviceBookPhotos[i], `service-book-${i}.jpg`);
          if (filename) metadata.documentation[`service_${i}`] = filename;
        }
      }

      // Upload locking wheel nut photos
      if (collectionData.lockingWheelNutPhotos && collectionData.lockingWheelNutPhotos.length > 0) {
        for (let i = 0; i < collectionData.lockingWheelNutPhotos.length; i++) {
          const filename = await uploadPhoto(collectionData.lockingWheelNutPhotos[i], `locking-wheel-nut-${i}.jpg`);
          if (filename) metadata.documentation[`locking_wheel_nut_${i}`] = filename;
        }
      }

      // Upload exterior photos
      if (collectionData.exteriorPhotos) {
        for (const [view, photos] of Object.entries(collectionData.exteriorPhotos)) {
          if (Array.isArray(photos)) {
            for (let i = 0; i < photos.length; i++) {
              const filename = await uploadPhoto(photos[i], `views/${view}-${i}.jpg`);
              if (filename) metadata.vehicleViews[`${view}_${i}`] = filename;
            }
          }
        }
      }

      // Upload interior photos
      if (collectionData.interiorPhotos) {
        for (const [view, photos] of Object.entries(collectionData.interiorPhotos)) {
          if (Array.isArray(photos)) {
            for (let i = 0; i < photos.length; i++) {
              const filename = await uploadPhoto(photos[i], `interior/${view}-${i}.jpg`);
              if (filename) metadata.interiorPhotos[`${view}_${i}`] = filename;
            }
          }
        }
      }

      // Upload odometer photos
      if (collectionData.odometerPhotos && collectionData.odometerPhotos.length > 0) {
        for (let i = 0; i < collectionData.odometerPhotos.length; i++) {
          const filename = await uploadPhoto(collectionData.odometerPhotos[i], `odometer-${i}.jpg`);
          if (filename) metadata.documentation[`odometer_${i}`] = filename;
        }
      }

      // Upload fuel photos
      if (collectionData.fuelPhotos && collectionData.fuelPhotos.length > 0) {
        for (let i = 0; i < collectionData.fuelPhotos.length; i++) {
          const filename = await uploadPhoto(collectionData.fuelPhotos[i], `fuel-${i}.jpg`);
          if (filename) metadata.documentation[`fuel_${i}`] = filename;
        }
      }

      // Upload wheel/tyre photos
      if (collectionData.wheels) {
        for (const [wheelPosition, wheelData] of Object.entries(collectionData.wheels)) {
          if ((wheelData as any).photos && Array.isArray((wheelData as any).photos)) {
            for (let i = 0; i < (wheelData as any).photos.length; i++) {
              const filename = await uploadPhoto((wheelData as any).photos[i], `wheels/${wheelPosition}-${i}.jpg`);
              if (filename) metadata.wheelPhotos[`${wheelPosition}_${i}`] = filename;
            }
          }
        }
      }

      // Upload damage marker photos
      if (collectionData.damageMarkers && Array.isArray(collectionData.damageMarkers)) {
        for (const marker of collectionData.damageMarkers) {
          if (marker.photos && Array.isArray(marker.photos)) {
            for (let i = 0; i < marker.photos.length; i++) {
              const filename = await uploadPhoto(marker.photos[i], `damage/${marker.id}-${i}.jpg`);
              if (filename) metadata.damagePhotos[`${marker.id}_${i}`] = filename;
            }
          }
        }
      }

      // Upload signature
      if (collectionData.signature || signature) {
        const signatureData = signature || collectionData.signature;
        const filename = await uploadPhoto(signatureData, 'customer-signature.png', 'image/png');
        if (filename) metadata.customerSignature = filename;
      }

      // Upload metadata.json
      await objectStorageService.uploadJobFile(
        jobId,
        'metadata.json',
        Buffer.from(JSON.stringify(metadata, null, 2)),
        'application/json'
      );

      console.log('✅ Photos uploaded to object storage:', {
        documentation: Object.keys(metadata.documentation).length,
        vehicleViews: Object.keys(metadata.vehicleViews).length,
        interiorPhotos: Object.keys(metadata.interiorPhotos).length,
        wheelPhotos: Object.keys(metadata.wheelPhotos).length,
        damagePhotos: Object.keys(metadata.damagePhotos).length,
        signature: !!metadata.customerSignature
      });

      // Update job status to collected
      await storage.updateJobStatus(jobId, 'collected');

      // ⚡ Clear the draft data (cleanup)
      await db.execute(sql`
        DELETE FROM collection_drafts WHERE job_id = ${jobId}
      `);

      console.log('⚡ COMPLETION SUCCESS: Job collected in <2 seconds!');

      // ⚡ GENERATE POC PDF - Asynchronously after response for speed
      setTimeout(async () => {
        try {
          console.log('📝 Starting POC generation for job:', jobId);
          const { FlawlessPOCService } = await import('../services/flawless-poc-generation');
          
          // Prepare POC data from auto-saved collection data
          const pocData = {
            JOB_NUMBER: job.jobNumber,
            COLLECTION_DATE: new Date(completedAt || Date.now()).toLocaleDateString('en-GB'),
            COLLECTION_TIME: new Date(completedAt || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            CUSTOMER_NAME: collectionData.contactMet || collectionData.customerName || 'Customer',
            CUSTOMER_CONTACT: job.customers?.contact || '',
            COLLECTION_ADDRESS: job.collectionAddress ? [
              job.collectionAddress.line1,
              job.collectionAddress.line2,
              job.collectionAddress.city,
              job.collectionAddress.postcode
            ].filter(Boolean) : ['Collection Address'],
            DELIVERY_ADDRESS: job.deliveryAddress ? [
              job.deliveryAddress.line1,
              job.deliveryAddress.line2,
              job.deliveryAddress.city,
              job.deliveryAddress.postcode
            ].filter(Boolean) : ['Delivery Address'],
            LOGO: '',
            DRIVER_NAME: job.assignedDriver?.name || 'Driver',
            VEHICLE_MAKE: job.vehicle?.make || 'Vehicle Make',
            VEHICLE_REG: job.vehicle?.registration || 'Vehicle Reg',
            VEHICLE_MILEAGE: collectionData.odometerReading || '0',
            VEHICLE_FUEL: `${collectionData.fuelLevel || 4}/8`,
            
            // Include ALL photos from auto-saved data
            EXTERIOR_PHOTOS: [
              ...(collectionData.exteriorPhotos?.front || []),
              ...(collectionData.exteriorPhotos?.rear || []),
              ...(collectionData.exteriorPhotos?.driverSide || []),
              ...(collectionData.exteriorPhotos?.passengerSide || []),
              ...(collectionData.exteriorPhotos?.roof || [])
            ],
            INTERIOR_PHOTOS: [
              ...(collectionData.interiorPhotos?.dashboard || []),
              ...(collectionData.interiorPhotos?.frontSeats || []),
              ...(collectionData.interiorPhotos?.rearSeats || []),
              ...(collectionData.interiorPhotos?.boot || [])
            ],
            WHEELS_PHOTOS: (() => {
              const wheelPhotos: string[] = [];
              if (collectionData.wheels) {
                ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'].forEach(pos => {
                  const wheel = (collectionData.wheels as any)[pos];
                  if (wheel?.photos && Array.isArray(wheel.photos)) {
                    wheelPhotos.push(...wheel.photos);
                  }
                });
              }
              return wheelPhotos;
            })(),
            WHEELS_STATUS: (() => {
              const wheelStatus: Array<{ position: string; scuffed: boolean }> = [];
              if (collectionData.wheels) {
                ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'].forEach(pos => {
                  const wheel = (collectionData.wheels as any)[pos];
                  if (wheel) {
                    wheelStatus.push({ position: pos, scuffed: wheel.scuffed || false });
                  }
                });
              }
              return wheelStatus;
            })(),
            KEYS_V5_PHOTOS: [
              ...(collectionData.keyPhotos || []),
              ...(collectionData.v5Photos || []),
              ...(collectionData.serviceBookPhotos || []),
              ...(collectionData.lockingWheelNutPhotos || [])
            ],
            
            // CRITICAL: Include damage markers and damage photos
            DAMAGE_MARKERS: collectionData.damageMarkers || [],
            DAMAGE_PHOTOS: (collectionData.damageMarkers || []).flatMap((marker: any) => marker.photos || []),
            
            // Customer info and conditions
            customerSignature: collectionData.signature || signature,
            POINT_OF_CONTACT_NAME: collectionData.contactMet || collectionData.customerName,
            WEATHER_CONDITIONS: collectionData.weatherConditions || collectionData.weather || 'dry',
            LIGHTING_CONDITIONS: collectionData.lightingConditions || 'light',
            VEHICLE_CLEANLINESS: collectionData.vehicleCleanliness || 'clean',
            DRIVER_ADDITIONAL_NOTES: collectionData.additionalNotes || ''
          };
          
          console.log('📊 POC will include:', {
            damageMarkers: pocData.DAMAGE_MARKERS.length,
            damagePhotos: pocData.DAMAGE_PHOTOS.length,
            exteriorPhotos: pocData.EXTERIOR_PHOTOS.length,
            interiorPhotos: pocData.INTERIOR_PHOTOS.length,
            keysV5Photos: pocData.KEYS_V5_PHOTOS.length,
            wheelsPhotos: pocData.WHEELS_PHOTOS.length,
            signature: !!pocData.customerSignature
          });
          
          await FlawlessPOCService.generatePOC(pocData);
          console.log('✅ POC generated successfully for job:', job.jobNumber);
        } catch (error) {
          console.error('⚠️ Background POC generation failed:', error);
        }
      }, 0); // Fire immediately but don't block response

      res.json({ 
        success: true, 
        message: 'Collection completed successfully',
        jobStatus: 'collected',
        performanceNote: 'Completed using auto-saved data - no massive payload!'
      });

    } catch (error) {
      console.error('Error completing collection:', error);
      res.status(500).json({ 
        error: 'Failed to complete collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete job file
  app.delete('/api/jobs/:jobId/files/:fileName', async (req, res) => {
    try {
      const { jobId, fileName } = req.params;
      
      await objectStorageService.deleteJobFile(jobId, fileName);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });
}