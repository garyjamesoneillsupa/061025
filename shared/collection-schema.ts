import { z } from "zod";

// Vehicle Collection Data Schema
export const vehicleCollectionSchema = z.object({
  // Job Information
  jobNumber: z.string(),
  jobId: z.string().optional(),
  driverId: z.string().optional(),
  
  // Vehicle Details Section (Required)
  v5Document: z.object({
    provided: z.boolean().optional(),
    photos: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    }))
  }),
  
  numberOfKeys: z.object({
    count: z.string().optional(), // "1", "2", "3", "4+"
    photos: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    }))
  }),
  
  serviceBook: z.object({
    provided: z.boolean().optional(),
    photos: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    }))
  }),
  
  lockingWheelNut: z.object({
    provided: z.boolean().optional(),
    photos: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    }))
  }),
  
  // Damage Markers (Optional)
  damageMarkers: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    panel: z.enum(['front', 'driver', 'rear', 'passenger', 'roof']),
    type: z.enum(['Scratch', 'Dent', 'Chip', 'Crack', 'Broken', 'Bad Repair', 'Paintwork']),
    size: z.enum(['Small', 'Medium', 'Large']),
    notes: z.string().optional(),
    photos: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    }))
  })),
  
  // Wheels & Tyres (Optional)
  wheels: z.object({
    frontLeft: z.object({
      scuffed: z.boolean().optional(),
      tyreCondition: z.enum(['OK', 'Worn', 'Extremely Worn']).optional(),
      photos: z.array(z.object({
        id: z.string(),
        imageData: z.string(),
        timestamp: z.number()
      }))
    }),
    frontRight: z.object({
      scuffed: z.boolean().optional(),
      tyreCondition: z.enum(['OK', 'Worn', 'Extremely Worn']).optional(),
      photos: z.array(z.object({
        id: z.string(),
        imageData: z.string(),
        timestamp: z.number()
      }))
    }),
    rearLeft: z.object({
      scuffed: z.boolean().optional(),
      tyreCondition: z.enum(['OK', 'Worn', 'Extremely Worn']).optional(),
      photos: z.array(z.object({
        id: z.string(),
        imageData: z.string(),
        timestamp: z.number()
      }))
    }),
    rearRight: z.object({
      scuffed: z.boolean().optional(),
      tyreCondition: z.enum(['OK', 'Worn', 'Extremely Worn']).optional(),
      photos: z.array(z.object({
        id: z.string(),
        imageData: z.string(),
        timestamp: z.number()
      }))
    })
  }),
  
  // Interior Photos (Optional)
  interior: z.object({
    dashboard: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    })),
    frontSeats: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    })),
    rearSeats: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    })),
    boot: z.array(z.object({
      id: z.string(),
      imageData: z.string(),
      timestamp: z.number()
    }))
  }),
  
  // Finalization (Optional)
  odometerReading: z.string().optional(),
  odometerPhotos: z.array(z.object({
    id: z.string(),
    imageData: z.string(),
    timestamp: z.number()
  })),
  fuelPhotos: z.array(z.object({
    id: z.string(),
    imageData: z.string(),
    timestamp: z.number()
  })),
  customerName: z.string().optional(),
  signature: z.string().optional(), // Base64 encoded signature
  additionalNotes: z.string().optional(),
  
  // Completion metadata
  completedAt: z.string().optional(),
  pocGenerated: z.boolean().default(false),
  pocPath: z.string().optional()
});

export type VehicleCollectionData = z.infer<typeof vehicleCollectionSchema>;

// Default empty state - absolutely no prefilled values
export const createEmptyCollectionData = (): VehicleCollectionData => ({
  jobNumber: '',
  v5Document: {
    provided: undefined as any, // Start completely undefined
    photos: []
  },
  numberOfKeys: {
    count: undefined,
    photos: []
  },
  serviceBook: {
    provided: undefined as any, // Start completely undefined  
    photos: []
  },
  lockingWheelNut: {
    provided: undefined as any, // Start completely undefined
    photos: []
  },
  damageMarkers: [],
  wheels: {
    frontLeft: {
      scuffed: undefined as any, // Start completely undefined
      tyreCondition: undefined as any, // Start completely undefined
      photos: []
    },
    frontRight: {
      scuffed: undefined as any, // Start completely undefined
      tyreCondition: undefined as any, // Start completely undefined
      photos: []
    },
    rearLeft: {
      scuffed: undefined as any, // Start completely undefined
      tyreCondition: undefined as any, // Start completely undefined
      photos: []
    },
    rearRight: {
      scuffed: undefined as any, // Start completely undefined
      tyreCondition: undefined as any, // Start completely undefined
      photos: []
    }
  },
  interior: {
    dashboard: [],
    frontSeats: [],
    rearSeats: [],
    boot: []
  },
  odometerPhotos: [],
  fuelPhotos: [],
  pocGenerated: false
});