import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the private object directory for job files
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Upload a file to the jobs/{jobId}/ structure
  async uploadJobFile(jobId: string, fileName: string, buffer: Buffer, contentType: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectPath = `${privateObjectDir}/jobs/${jobId}/${fileName}`;
    
    const { bucketName, objectName } = parseObjectPath(objectPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          uploadedAt: new Date().toISOString(),
          jobId: jobId
        }
      }
    });

    return objectPath;
  }

  // Get upload URL for direct client-side uploads to jobs/{jobId}/ structure
  async getJobFileUploadURL(jobId: string, fileName: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectPath = `${privateObjectDir}/jobs/${jobId}/${fileName}`;
    
    const { bucketName, objectName } = parseObjectPath(objectPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // List files in a job directory
  async listJobFiles(jobId: string): Promise<{ name: string; size: number; uploaded: Date }[]> {
    const privateObjectDir = this.getPrivateObjectDir();
    const prefix = `${privateObjectDir}/jobs/${jobId}/`.replace(/^\//, '');
    
    const { bucketName } = parseObjectPath(privateObjectDir);
    const bucket = objectStorageClient.bucket(bucketName);
    
    const [files] = await bucket.getFiles({ prefix });
    
    return files.map(file => ({
      name: file.name.split('/').pop() || file.name,
      size: parseInt(String(file.metadata.size || '0')),
      uploaded: new Date(file.metadata.timeCreated || Date.now())
    }));
  }

  // Get a job file for download/streaming
  async getJobFile(jobId: string, fileName: string): Promise<File> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectPath = `${privateObjectDir}/jobs/${jobId}/${fileName}`;
    
    const { bucketName, objectName } = parseObjectPath(objectPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return file;
  }

  // Stream a file to HTTP response
  async downloadFile(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Delete a job file
  async deleteJobFile(jobId: string, fileName: string): Promise<void> {
    const file = await this.getJobFile(jobId, fileName);
    await file.delete();
  }

  // Delete entire job directory
  async deleteJobFiles(jobId: string): Promise<void> {
    const privateObjectDir = this.getPrivateObjectDir();
    const prefix = `${privateObjectDir}/jobs/${jobId}/`.replace(/^\//, '');
    
    const { bucketName } = parseObjectPath(privateObjectDir);
    const bucket = objectStorageClient.bucket(bucketName);
    
    const [files] = await bucket.getFiles({ prefix });
    
    await Promise.all(files.map(file => file.delete()));
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}