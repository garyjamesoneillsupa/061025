// Advanced photo compression engine for maximum efficiency
import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
  initialQuality: number;
}

export class PhotoCompressionEngine {
  static getCompressionSettings(fileSize: number, imageType: string): CompressionOptions {
    // Adaptive compression based on file size and type
    const sizeMB = fileSize / 1024 / 1024;
    
    if (sizeMB > 10) {
      // Large files - aggressive compression
      return {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.7
      };
    } else if (sizeMB > 5) {
      // Medium files - balanced compression
      return {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.75
      };
    } else {
      // Small files - light compression
      return {
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: imageType.includes('png') ? 'image/jpeg' : imageType, // Convert PNG to JPEG for better compression
        initialQuality: 0.8
      };
    }
  }

  static async progressiveCompress(file: File, targetSizeMB: number): Promise<Blob> {
    let quality = 0.9;
    let compressed = file;
    let attempts = 0;
    const maxAttempts = 5;

    while (compressed.size / 1024 / 1024 > targetSizeMB && attempts < maxAttempts) {
      try {
        compressed = await imageCompression(compressed, {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: quality
        });
        
        quality -= 0.1;
        attempts++;
        
        console.log(`🔄 Compression attempt ${attempts}: ${(compressed.size / 1024).toFixed(1)}KB (quality: ${quality + 0.1})`);
      } catch (error) {
        console.warn('Compression attempt failed:', error);
        break;
      }
    }

    return compressed;
  }
}

export async function compressImage(file: File): Promise<Blob> {
  try {
    const originalSize = file.size / 1024; // KB
    console.log(`🗜️ Compressing image: ${originalSize.toFixed(1)}KB`);

    // Get adaptive compression settings
    const settings = PhotoCompressionEngine.getCompressionSettings(file.size, file.type);
    
    let compressedFile: Blob;
    
    // Try progressive compression for very large files
    if (file.size > 5 * 1024 * 1024) { // > 5MB
      compressedFile = await PhotoCompressionEngine.progressiveCompress(file, settings.maxSizeMB);
    } else {
      // Standard compression
      compressedFile = await imageCompression(file, {
        maxSizeMB: settings.maxSizeMB,
        maxWidthOrHeight: settings.maxWidthOrHeight,
        useWebWorker: settings.useWebWorker,
        fileType: settings.fileType,
        initialQuality: settings.initialQuality
      });
    }

    const compressedSize = compressedFile.size / 1024; // KB
    const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100);
    
    console.log(`✅ Compression complete: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${compressionRatio}% reduction)`);
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

export async function compressSignature(signatureDataUrl: string): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();
    
    // Compress if signature is large
    if (blob.size > 100 * 1024) { // > 100KB
      const compressedBlob = await imageCompression(blob as File, {
        maxSizeMB: 0.05, // 50KB max
        maxWidthOrHeight: 400,
        useWebWorker: false,
        fileType: 'image/jpeg',
        initialQuality: 0.7
      });
      
      // Convert back to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedBlob);
      });
    }
    
    return signatureDataUrl;
  } catch (error) {
    console.error('❌ Signature compression failed:', error);
    return signatureDataUrl;
  }
}