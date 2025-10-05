import type { Express } from "express";
import { FreshPODGenerationService } from "../services/fresh-pod-generation";
import type { Job } from "@shared/schema";

export function registerFreshPODRoutes(app: Express) {
  // Generate POD route
  app.post('/api/fresh/generate-fresh-pod/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      console.log('🚀 Generating Fresh POD for job:', jobId);

      // In a real implementation, fetch actual job and delivery data from database
      // For now, using structured test data that matches the delivery workflow
      const mockDeliveryData = {
        // Vehicle Information
        vehicleRegistration: 'DS20 FBB',
        make: 'BMW',
        model: 'X5',
        
        // Delivery Location  
        deliveryAddress: '45 Merchant City Way\nGlasgow\nG1 2AB',
        
        // Job Information
        jobReference: '250725001',
        deliveryDate: new Date().toLocaleDateString('en-GB'),
        driverName: 'John Smith',
        
        // Vehicle Condition at Delivery
        finalMileage: '52,847',
        finalFuelLevel: '6/8',
        
        // Delivery Assessment
        exteriorCondition: 'Excellent',
        exteriorNotes: 'No issues noted during delivery inspection',
        
        interiorCondition: 'Very Good', 
        interiorNotes: 'Clean and tidy throughout',
        
        // New Damage Assessment (typically empty for successful transport)
        newDamageMarkers: [],
        
        // Delivery Photos (would be populated from actual delivery workflow)
        deliveryPhotos: {
          front: [],
          rear: [],
          driverSide: [],
          passengerSide: [],
          interior: [],
          other: []
        },
        
        // Customer Confirmation
        customerName: 'Sarah Johnson',
        customerSignature: '', // Would be base64 signature from delivery workflow
        customerComments: 'Vehicle delivered in excellent condition. Very professional service.',
        
        // Driver Confirmation
        driverSignature: '' // Would be base64 signature from delivery workflow
      };

      const pdfBuffer = await FreshPODGenerationService.generatePOD(mockDeliveryData);
      
      console.log('🚀 Fresh POD generated successfully');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="POD-${mockDeliveryData.jobReference}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('POD Generation failed:', error);
      res.status(500).json({ 
        error: 'POD generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}