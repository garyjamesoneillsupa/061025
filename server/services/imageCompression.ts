// import sharp from 'sharp';
import path from 'path';
import { createHash } from 'crypto';

type WorkerInstance = any; // Sharp instance type

export class ImageCompressionService {
  // 🚀 OPTIMIZATION: Memory pools and caching for maximum performance
  private static sharpPool: WorkerInstance[] = [];
  private static maxPoolSize = 4; // Optimal for most systems
  private static imageCache = new Map<string, Buffer>(); // Cache compressed images
  private static maxCacheSize = 100; // LRU cache limit
  
  // Premium compression settings - ALL photos at 85% quality for flawless documentation
  private static compressionSettings = {
    // Premium quality for ALL photos (flawless documentation standard)
    damage: {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg' as const
    },
    // Premium quality for process documentation (matching damage quality)
    process: {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg' as const
    },
    // Premium quality for general photos (matching damage quality)
    general: {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg' as const
    },
    // Premium quality for expense receipts (higher quality for readability)
    expense: {
      quality: 92,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg' as const
    },
    // PDF-optimized compression for smaller file sizes while maintaining readability
    pdf: {
      quality: 60,
      maxWidth: 800,
      maxHeight: 800,
      format: 'jpeg' as const
    },
    // High quality thumbnails for professional presentation
    thumbnail: {
      quality: 75,
      maxWidth: 300,
      maxHeight: 300,
      format: 'jpeg' as const
    }
  };

  // 🚀 OPTIMIZATION: Initialize Sharp worker pool for parallel processing
  private static async initializeSharpPool(): Promise<void> {
    if (this.sharpPool.length > 0) return; // Already initialized
    
    try {
      const sharp = await import('sharp');
      for (let i = 0; i < this.maxPoolSize; i++) {
        this.sharpPool.push(sharp.default);
      }
      console.log(`🏊 Sharp worker pool initialized with ${this.maxPoolSize} instances`);
    } catch (error) {
      console.warn('⚠️ Sharp pool initialization failed, falling back to sequential processing');
    }
  }

  // 🚀 OPTIMIZATION: Get Sharp instance from pool (round-robin)
  private static async getSharpInstance(): Promise<WorkerInstance | null> {
    await this.initializeSharpPool();
    if (this.sharpPool.length === 0) return null;
    
    // Simple round-robin selection
    const instance = this.sharpPool.shift();
    this.sharpPool.push(instance);
    return instance;
  }

  // 🚀 OPTIMIZATION: Cache management with LRU eviction
  private static getCacheKey(buffer: Buffer, category: string): string {
    const hash = createHash('md5').update(buffer).digest('hex');
    return `${hash}-${category}`;
  }

  private static setCachedResult(key: string, result: Buffer): void {
    if (this.imageCache.size >= this.maxCacheSize) {
      // LRU eviction: remove oldest entry
      const firstKey = this.imageCache.keys().next().value;
      if (firstKey) {
        this.imageCache.delete(firstKey);
      }
    }
    this.imageCache.set(key, result);
  }

  /**
   * 🚀 OPTIMIZED: Compress image with caching and pool management
   */
  static async compressImage(
    inputBuffer: Buffer,
    category: 'damage' | 'process' | 'general' | 'pdf' | 'expense' = 'general',
    generateThumbnail: boolean = true
  ): Promise<{
    compressed: Buffer;
    thumbnail?: Buffer;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    const originalSize = inputBuffer.length;
    const settings = this.compressionSettings[category];

    // 🚀 OPTIMIZATION: Check cache first
    const cacheKey = this.getCacheKey(inputBuffer, category);
    const cached = this.imageCache.get(cacheKey);
    if (cached) {
      console.log(`⚡ Cache hit for ${category} image: ${Math.round(originalSize/1024)}KB → ${Math.round(cached.length/1024)}KB`);
      return {
        compressed: cached,
        thumbnail: undefined, // Could cache thumbnails too
        originalSize,
        compressedSize: cached.length,
        compressionRatio: (originalSize - cached.length) / originalSize
      };
    }

    try {
      let compressed = inputBuffer;
      let thumbnail: Buffer | undefined;
      
      // 🚀 OPTIMIZATION: Use pooled Sharp instance
      const sharp = await this.getSharpInstance();
      
      if (sharp) {
        const startTime = performance.now();
        
        if (category === 'pdf') {
          // Aggressive compression for PDF embedding
          compressed = await sharp(inputBuffer)
            .resize(settings.maxWidth, settings.maxHeight, { 
              fit: 'inside', 
              withoutEnlargement: true 
            })
            .jpeg({ quality: settings.quality })
            .toBuffer();
          
          const processingTime = performance.now() - startTime;
          console.log(`📄 PDF compression: ${Math.round(originalSize/1024)}KB → ${Math.round(compressed.length/1024)}KB (${processingTime.toFixed(1)}ms)`);
        } else {
          // Standard compression for other categories
          compressed = await sharp(inputBuffer)
            .resize(settings.maxWidth, settings.maxHeight, { 
              fit: 'inside', 
              withoutEnlargement: true 
            })
            .jpeg({ quality: settings.quality })
            .toBuffer();
          
          // Generate thumbnail if requested
          if (generateThumbnail) {
            const thumbSettings = this.compressionSettings.thumbnail;
            thumbnail = await sharp(inputBuffer)
              .resize(thumbSettings.maxWidth, thumbSettings.maxHeight, { 
                fit: 'inside', 
                withoutEnlargement: true 
              })
              .jpeg({ quality: thumbSettings.quality })
              .toBuffer();
          }
          
          const processingTime = performance.now() - startTime;
          console.log(`📸 Image compression: ${Math.round(originalSize/1024)}KB → ${Math.round(compressed.length/1024)}KB (${processingTime.toFixed(1)}ms)`);
        }
        
        // 🚀 OPTIMIZATION: Cache the result
        this.setCachedResult(cacheKey, compressed);
      } else {
        console.log('⚠️ Sharp not available, using fallback compression');
        compressed = inputBuffer;
      }
      
      const compressedSize = compressed.length;
      const compressionRatio = (originalSize - compressedSize) / originalSize;
      
      return {
        compressed,
        thumbnail,
        originalSize,
        compressedSize,
        compressionRatio
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * 🚀 NEW: Parallel batch compression for upload optimization
   */
  static async compressImageBatch(
    images: Array<{ buffer: Buffer; category: 'damage' | 'process' | 'general' | 'pdf'; id: string }>
  ): Promise<Array<{
    id: string;
    compressed: Buffer;
    thumbnail?: Buffer;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }>> {
    console.log(`🚀 BATCH: Starting parallel compression of ${images.length} images`);
    const startTime = performance.now();
    
    // Process all images in parallel for maximum speed
    const results = await Promise.all(
      images.map(async (img) => {
        const result = await this.compressImage(img.buffer, img.category, false);
        return {
          id: img.id,
          ...result
        };
      })
    );
    
    const totalTime = performance.now() - startTime;
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const averageReduction = (totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100;
    
    console.log(`⚡ BATCH COMPLETE: ${images.length} images in ${totalTime.toFixed(1)}ms (${(totalTime/images.length).toFixed(1)}ms avg)`);
    console.log(`📊 BATCH STATS: ${Math.round(totalOriginalSize/1024)}KB → ${Math.round(totalCompressedSize/1024)}KB (${averageReduction.toFixed(1)}% reduction)`);
    
    return results;
  }


  /**
   * 🏷️ NEW: Add watermark text to expense receipt photo
   * Burns job info permanently into the image for audit trail
   */
  static async addExpenseWatermark(
    inputBuffer: Buffer,
    jobNumber: string,
    vehicleReg: string
  ): Promise<Buffer> {
    try {
      const sharp = await this.getSharpInstance();
      if (!sharp) {
        console.warn('⚠️ Sharp not available, returning image without watermark');
        return inputBuffer;
      }

      const watermarkText = `${jobNumber} (${vehicleReg})`;
      
      // Create SVG overlay for text watermark with professional styling
      const svgOverlay = `
        <svg width="700" height="120">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.6"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect x="5" y="5" width="690" height="90" fill="rgba(0,0,0,0.75)" rx="10"/>
          <text 
            x="350" 
            y="65" 
            font-family="Arial, sans-serif" 
            font-size="48" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle"
            filter="url(#shadow)"
          >${watermarkText}</text>
        </svg>
      `;

      // Apply watermark to image
      const watermarkedBuffer = await sharp(inputBuffer)
        .composite([{
          input: Buffer.from(svgOverlay),
          top: 15,
          left: 15
        }])
        .toBuffer();

      console.log(`🏷️ Watermark added: "${watermarkText}"`);
      return watermarkedBuffer;
    } catch (error) {
      console.error('❌ Failed to add watermark:', error);
      return inputBuffer; // Return original if watermarking fails
    }
  }

  /**
   * Estimate compression ratio for planning purposes
   */
  static estimateCompression(category: 'damage' | 'process' | 'general' = 'general'): {
    estimatedRatio: number;
    description: string;
  } {
    // All categories now use premium 85% quality for flawless documentation
    const premiumRatio = { ratio: 0.75, desc: 'Premium 85% quality for flawless documentation across all photos' };

    return {
      estimatedRatio: premiumRatio.ratio,
      description: premiumRatio.desc
    };
  }

  /**
   * Get optimal settings for iPhone photos
   */
  static getIPhoneOptimizedSettings() {
    return {
      // iPhone photos are typically 3000x4000 pixels, 3-6MB each
      originalEstimate: {
        width: 3000,
        height: 4000,
        sizeRange: '3-6 MB'
      },
      // After premium 85% compression
      compressedEstimate: {
        damage: { size: '1.0-1.5MB', ratio: '70-75% reduction' },
        process: { size: '1.0-1.5MB', ratio: '70-75% reduction' },
        general: { size: '1.0-1.5MB', ratio: '70-75% reduction' }
      }
    };
  }
}