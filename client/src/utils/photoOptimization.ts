// Photo optimization utilities for better performance
export class PhotoOptimizer {
  static MAX_WIDTH = 1200;
  static MAX_HEIGHT = 1200;
  static QUALITY = 0.7;

  /**
   * Compress and resize a base64 image
   */
  static async compressImage(base64String: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > this.MAX_WIDTH) {
            height = (height * this.MAX_WIDTH) / width;
            width = this.MAX_WIDTH;
          }
        } else {
          if (height > this.MAX_HEIGHT) {
            width = (width * this.MAX_HEIGHT) / height;
            height = this.MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', this.QUALITY);
        resolve(compressedBase64);
      };
      
      img.src = base64String;
    });
  }

  /**
   * Get file size of base64 string in KB
   */
  static getBase64SizeKB(base64String: string): number {
    const base64Data = base64String.split(',')[1] || base64String;
    const sizeInBytes = (base64Data.length * 3) / 4;
    return Math.round(sizeInBytes / 1024);
  }

  /**
   * Compress multiple photos with progress callback
   */
  static async compressPhotos(
    photos: string[], 
    onProgress?: (completed: number, total: number) => void
  ): Promise<string[]> {
    const compressed: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const compressedPhoto = await this.compressImage(photos[i]);
      compressed.push(compressedPhoto);
      
      if (onProgress) {
        onProgress(i + 1, photos.length);
      }
    }
    
    return compressed;
  }

  /**
   * Optimize a File object (for use with input[type="file"])
   */
  static async optimizePhoto(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          const compressedBase64 = await this.compressImage(base64);
          
          // Convert back to File
          const response = await fetch(compressedBase64);
          const blob = await response.blob();
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(optimizedFile);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create a thumbnail for quick preview
   */
  static async createThumbnail(base64String: string, size: number = 150): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = size;
        canvas.height = size;
        
        // Calculate crop area for square thumbnail
        const { width, height } = img;
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;
        
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };
      
      img.src = base64String;
    });
  }
}

// Progress tracking for large uploads
export class UploadProgress {
  private callbacks: Array<(progress: number) => void> = [];
  private _progress = 0;

  get progress() {
    return this._progress;
  }

  set progress(value: number) {
    this._progress = Math.min(100, Math.max(0, value));
    this.callbacks.forEach(callback => callback(this._progress));
  }

  onProgress(callback: (progress: number) => void) {
    this.callbacks.push(callback);
  }

  reset() {
    this._progress = 0;
    this.callbacks.forEach(callback => callback(0));
  }
}