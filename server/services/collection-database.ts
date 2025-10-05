import { db } from "../db";
import { vehicleInspections, jobs, photos, damageReports, jobProcessRecords } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { VehicleCollectionData } from "@shared/collection-schema";
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export class CollectionDatabaseService {

  /**
   * Simplified collection save for bulletproof workflow
   */
  static async saveBulletproofCollection(jobId: string, collectionData: any): Promise<string> {
    try {
      console.log('🚀 Starting bulletproof collection save for job:', jobId);
      
      // Generate inspection ID
      const inspectionId = nanoid();
      
      // Save vehicle inspection record
      const [inspection] = await db
        .insert(vehicleInspections)
        .values({
          jobId: jobId,
          inspectionType: 'collection',
          inspectionData: collectionData,
          completedAt: new Date(),
          createdAt: new Date()
        })
        .returning();

      console.log('✅ Vehicle inspection saved with ID:', inspection.id);

      // Update job status to "Collected" 
      await db
        .update(jobs)
        .set({ 
          status: 'collected'
        })
        .where(eq(jobs.id, jobId));

      console.log('✅ Job status updated to Collected for job ID:', jobId);

      // Save all photos with proper error handling
      const photoPromises = [];

      // V5 Document photos
      if (collectionData.v5Document?.photos) {
        for (const photo of collectionData.v5Document.photos) {
          photoPromises.push(
            db.insert(photos).values({
              jobId: jobId,
              stage: 'collection',
              category: 'v5_document',
              filename: `v5_${photo.timestamp}.jpg`,
              originalName: `v5_photo_${photo.timestamp}.jpg`,
              mimeType: 'image/jpeg',
              createdAt: new Date()
            }).catch(err => console.error('Failed to save V5 photo:', err))
          );
        }
      }

      // Key photos
      if (collectionData.numberOfKeys?.photos) {
        for (const photo of collectionData.numberOfKeys.photos) {
          photoPromises.push(
            db.insert(photos).values({
              jobId: jobId,
              stage: 'collection',
              category: 'keys',
              filename: `keys_${photo.timestamp}.jpg`,
              originalName: `keys_photo_${photo.timestamp}.jpg`,
              mimeType: 'image/jpeg',
              createdAt: new Date()
            }).catch(err => console.error('Failed to save key photo:', err))
          );
        }
      }

      // Service book photos
      if (collectionData.serviceBook?.photos) {
        for (const photo of collectionData.serviceBook.photos) {
          photoPromises.push(
            db.insert(photos).values({
              jobId: jobId,
              stage: 'collection',
              category: 'service_book',
              filename: `service_${photo.timestamp}.jpg`,
              originalName: `service_photo_${photo.timestamp}.jpg`,
              mimeType: 'image/jpeg',
              createdAt: new Date()
            }).catch(err => console.error('Failed to save service book photo:', err))
          );
        }
      }

      // Locking wheel nut photos
      if (collectionData.lockingWheelNut?.photos) {
        for (const photo of collectionData.lockingWheelNut.photos) {
          photoPromises.push(
            db.insert(photos).values({
              jobId: jobId,
              stage: 'collection',
              category: 'locking_wheel_nut',
              filename: `wheel_${photo.timestamp}.jpg`,
              originalName: `wheel_photo_${photo.timestamp}.jpg`,
              mimeType: 'image/jpeg',
              createdAt: new Date()
            }).catch(err => console.error('Failed to save wheel nut photo:', err))
          );
        }
      }

      // Wait for all photos to be saved
      await Promise.allSettled(photoPromises);
      console.log(`✅ Processed ${photoPromises.length} photo save operations`);

      return inspection.id;
    } catch (error) {
      console.error('❌ Bulletproof collection save error:', error);
      throw error;
    }
  }
  /**
   * Save vehicle collection data to database
   */
  static async saveCollectionToDatabase(
    jobId: string,
    collectionData: VehicleCollectionData
  ): Promise<string> {
    try {
      // Process and save photos first
      const processedPhotos = await this.processAndSavePhotos(jobId, collectionData);
      
      // Create inspection record
      const [inspection] = await db.insert(vehicleInspections).values({
        jobId,
        jobNumber: collectionData.jobNumber,
        inspectionType: 'collection',
        data: {
          customerDetails: {
            name: collectionData.customerName || '',
            signature: collectionData.signature || ''
          },
          vehicleDetails: {
            mileageReading: collectionData.odometerReading || '',
            fuelLevel: 0, // Will be enhanced later
            odometerPhoto: processedPhotos.odometer[0] || ''
          },
          damageMarkers: collectionData.damageMarkers.map(marker => ({
            id: marker.id,
            x: marker.x,
            y: marker.y,
            view: marker.panel,
            damageType: marker.type.toLowerCase() as any,
            size: marker.size.toLowerCase() as any,
            description: marker.notes || '',
            photos: processedPhotos.damage[marker.id] || [],
            timestamp: Date.now()
          })),
          wheelsAndTyres: [
            {
              wheelNumber: 1,
              wheelPosition: 'Front Left',
              wheelScuffed: false, // Default: not scuffed since we don't capture this
              wheelPhotos: processedPhotos.wheels.frontLeft || [],
              tyreCondition: 'ok' as any, // Default: OK since we don't capture this  
              tyrePhotos: []
            },
            {
              wheelNumber: 2,
              wheelPosition: 'Front Right',
              wheelScuffed: false, // Default: not scuffed since we don't capture this
              wheelPhotos: processedPhotos.wheels.frontRight || [],
              tyreCondition: 'ok' as any, // Default: OK since we don't capture this
              tyrePhotos: []
            },
            {
              wheelNumber: 3,
              wheelPosition: 'Rear Left',
              wheelScuffed: false, // Default: not scuffed since we don't capture this
              wheelPhotos: processedPhotos.wheels.rearLeft || [],
              tyreCondition: 'ok' as any, // Default: OK since we don't capture this
              tyrePhotos: []
            },
            {
              wheelNumber: 4,
              wheelPosition: 'Rear Right',
              wheelScuffed: false, // Default: not scuffed since we don't capture this
              wheelPhotos: processedPhotos.wheels.rearRight || [],
              tyreCondition: 'ok' as any, // Default: OK since we don't capture this
              tyrePhotos: []
            }
          ],
          generalPhotos: [
            ...processedPhotos.v5Document,
            ...processedPhotos.keys,
            ...processedPhotos.serviceBook,
            ...processedPhotos.lockingWheelNut,
            ...processedPhotos.interior.dashboard,
            ...processedPhotos.interior.frontSeats,
            ...processedPhotos.interior.rearSeats,
            ...processedPhotos.interior.boot,
            ...processedPhotos.fuel
          ],
          additionalNotes: collectionData.additionalNotes || ''
        }
      }).returning();

      // Create job process record
      await db.insert(jobProcessRecords).values({
        jobId,
        stage: 'collection',
        mileageReading: collectionData.odometerReading,
        numberOfKeys: parseInt(collectionData.numberOfKeys.count || '0'),
        v5Present: collectionData.v5Document.provided || false,
        handbookServiceBookPresent: collectionData.serviceBook.provided || false,
        lockingWheelNutPresent: collectionData.lockingWheelNut.provided || false,
        customerName: collectionData.customerName,
        customerSignature: collectionData.signature,
        additionalNotes: collectionData.additionalNotes,
        inspectionData: collectionData
      });

      // Update job status to collected - critical fix
      console.log(`Updating job ${jobId} status to collected`);
      const updateResult = await db.update(jobs)
        .set({ 
          status: 'collected',
          collectedAt: new Date()
        })
        .where(eq(jobs.id, jobId))
        .returning();
      
      console.log(`Job status update result:`, updateResult);

      // Save individual damage reports
      for (const marker of collectionData.damageMarkers) {
        await db.insert(damageReports).values({
          jobId,
          panel: this.mapPanelToEnum(marker.panel),
          damageType: this.mapDamageTypeToEnum(marker.type),
          stage: 'collection',
          notes: marker.notes
        });
      }

      return inspection.id;
    } catch (error) {
      console.error('Error saving collection to database:', error);
      throw new Error('Failed to save collection data to database');
    }
  }

  /**
   * Process and save all photos from collection data
   */
  private static async processAndSavePhotos(
    jobId: string,
    collectionData: VehicleCollectionData
  ): Promise<any> {
    const photoResults = {
      v5Document: [] as string[],
      keys: [] as string[],
      serviceBook: [] as string[],
      lockingWheelNut: [] as string[],
      damage: {} as Record<string, string[]>,
      wheels: {
        frontLeft: [] as string[],
        frontRight: [] as string[],
        rearLeft: [] as string[],
        rearRight: [] as string[]
      },
      interior: {
        dashboard: [] as string[],
        frontSeats: [] as string[],
        rearSeats: [] as string[],
        boot: [] as string[]
      },
      odometer: [] as string[],
      fuel: [] as string[]
    };

    // Process V5 Document photos
    for (const photo of collectionData.v5Document.photos) {
      const photoPath = await this.savePhoto(jobId, photo.imageData, 'v5_document', 'collection');
      photoResults.v5Document.push(photoPath);
    }

    // Process Keys photos
    for (const photo of collectionData.numberOfKeys.photos) {
      const photoPath = await this.savePhoto(jobId, photo.imageData, 'keys', 'collection');
      photoResults.keys.push(photoPath);
    }

    // Process Service Book photos
    for (const photo of collectionData.serviceBook.photos) {
      const photoPath = await this.savePhoto(jobId, photo.imageData, 'service_book', 'collection');
      photoResults.serviceBook.push(photoPath);
    }

    // Process Locking Wheel Nut photos
    for (const photo of collectionData.lockingWheelNut.photos) {
      const photoPath = await this.savePhoto(jobId, photo.imageData, 'locking_wheel_nut', 'collection');
      photoResults.lockingWheelNut.push(photoPath);
    }

    // Process damage photos
    for (const marker of collectionData.damageMarkers) {
      photoResults.damage[marker.id] = [];
      for (const photo of marker.photos) {
        const photoPath = await this.savePhoto(jobId, photo.imageData, 'damage', 'collection');
        photoResults.damage[marker.id].push(photoPath);
      }
    }

    // Process wheel photos
    const wheelPositions = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'] as const;
    for (const position of wheelPositions) {
      for (const photo of collectionData.wheels[position].photos) {
        const photoPath = await this.savePhoto(jobId, photo.imageData, `wheel_${position}`, 'collection');
        photoResults.wheels[position].push(photoPath);
      }
    }

    // Process interior photos
    const interiorAreas = ['dashboard', 'frontSeats', 'rearSeats', 'boot'] as const;
    for (const area of interiorAreas) {
      for (const photo of collectionData.interior[area]) {
        const photoPath = await this.savePhoto(jobId, photo.imageData, `interior_${area}`, 'collection');
        photoResults.interior[area].push(photoPath);
      }
    }

    // Process odometer photos
    for (const photo of collectionData.odometerPhotos) {
      const photoPath = await this.savePhoto(jobId, photo.imageData, 'odometer', 'collection');
      photoResults.odometer.push(photoPath);
    }

    // Process fuel photos
    for (const photo of collectionData.fuelPhotos) {
      const photoPath = await this.savePhoto(jobId, photo.imageData, 'fuel_gauge', 'collection');
      photoResults.fuel.push(photoPath);
    }

    return photoResults;
  }

  /**
   * Save a single photo and create database record
   */
  private static async savePhoto(
    jobId: string,
    imageData: string,
    category: string,
    stage: string
  ): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'collections');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Compress and optimize image for performance
      const optimizedBuffer = await sharp(buffer)
        .jpeg({ quality: 70, mozjpeg: true })
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      // Generate filename
      const filename = `${jobId}_${category}_${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      const relativePath = `uploads/collections/${filename}`;

      // Save file
      fs.writeFileSync(filePath, optimizedBuffer);

      // Create database record
      const [photo] = await db.insert(photos).values({
        jobId,
        filename,
        originalName: `${category}_photo.jpg`,
        mimeType: 'image/jpeg',
        size: optimizedBuffer.length,
        url: `/${relativePath}`,
        category,
        stage
      }).returning();

      return photo.url;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw new Error('Failed to save photo');
    }
  }

  /**
   * Get collection data from database
   */
  static async getCollectionData(jobId: string): Promise<any> {
    try {
      const [inspection] = await db
        .select()
        .from(vehicleInspections)
        .where(and(
          eq(vehicleInspections.jobId, jobId),
          eq(vehicleInspections.inspectionType, 'collection')
        ));

      return inspection?.data || null;
    } catch (error) {
      console.error('Error getting collection data:', error);
      return null;
    }
  }

  /**
   * Map panel names to database enum values
   */
  private static mapPanelToEnum(panel: string): any {
    const mapping: Record<string, string> = {
      'front': 'front_bumper',
      'driver': 'ns_front_door',
      'rear': 'rear_bumper',
      'passenger': 'os_front_door',
      'roof': 'roof_panel'
    };
    return mapping[panel] || 'front_bumper';
  }

  /**
   * Map damage types to database enum values
   */
  private static mapDamageTypeToEnum(damageType: string): any {
    const mapping: Record<string, string> = {
      'Scratch': 'light_scratch',
      'Dent': 'small_dent',
      'Chip': 'chip',
      'Crack': 'crack',
      'Broken': 'generic_damage',
      'Bad Repair': 'generic_damage',
      'Paintwork': 'paintwork_damage'
    };
    return mapping[damageType] || 'generic_damage';
  }
}