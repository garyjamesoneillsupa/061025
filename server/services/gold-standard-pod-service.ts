// Flawless POC Generation - Exact User Specification Implementation
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export interface DamageMarker {
  id: string;
  view: "front" | "driverSide" | "rear" | "passengerSide"; // Updated to match UI structure
  x: number; // Percentage coordinates (0-100)
  y: number; // Percentage coordinates (0-100)
  type: "scratch" | "dent" | "scuff" | "chip" | "rust" | "crack" | "other"; // UI field name
  size: "small" | "medium" | "large"; // UI field name
  description: string; // Description field from UI
  photos: string[]; // Base64 photos from UI
}

export interface GoldStandardDeliveryData {
  JOB_NUMBER: string;
  COLLECTION_DATE: string;
  COLLECTION_TIME: string;
  DRIVER_NAME: string;
  CUSTOMER_NAME: string;
  CUSTOMER_CONTACT: string;
  COLLECTION_ADDRESS: string[];
  DELIVERY_ADDRESS: string[];
  VEHICLE_MAKE: string;
  VEHICLE_REG: string;
  VEHICLE_MILEAGE: string;
  VEHICLE_FUEL: string;
  LOGO: string;
  EXTERIOR_PHOTOS: string[];
  INTERIOR_PHOTOS: string[];
  WHEELS_PHOTOS: string[];
  WHEELS_STATUS?: Array<{ position: string; scuffed: boolean }>; // Wheel status data
  KEYS_V5_PHOTOS: string[]; // Keys, V5, locking wheel nut, service book
  FUEL_MILEAGE_PHOTOS?: string[]; // Fuel gauge and odometer/mileage photos
  DOCUMENT_PRESENCE?: {
    // Document presence flags for N/A placeholders
    hasKeys: boolean;
    hasV5: boolean;
    hasLockingWheelNut: boolean;
    hasServiceBook: boolean;
  };
  DAMAGE_PHOTOS: string[];
  DAMAGE_MARKERS: DamageMarker[]; // Damage coordinates and details from collection workflow
  customerSignature?: string; // Customer signature from collection process
  POINT_OF_CONTACT_NAME?: string; // Point of contact name
  WEATHER_CONDITIONS?: string; // Weather conditions
  LIGHTING_CONDITIONS?: string; // Lighting conditions
  VEHICLE_CLEANLINESS?: string; // Vehicle cleanliness
  DRIVER_ADDITIONAL_NOTES?: string; // Driver's notes entered at end of collection
}

export class GoldStandardPODGenerationService {
  // Helper method to capitalize condition words properly
  static capitalizeCondition(text: string): string {
    return text.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  }

  static async generatePOD(data: GoldStandardDeliveryData): Promise<Buffer> {
    try {
      console.log(
        `🚀 PARALLEL POC: Starting optimized generation for ${data.JOB_NUMBER}`,
      );

      // User color specifications - titles black, borders gray
      const C = {
        ovmBlue: "#00ABE7",
        text: "#000000",
        labels: "#000000", // Black for titles and labels
        meta: "#000000", // Black for text content
        rules: "#E6E6E6", // Gray borders (NOT black)
        white: "#ffffff",
        cardBg: "#f8f9fa", // Light gray background for cards
        damageRed: "#DC2626", // Red for damage markers
        placeholderGray: "#e5e7eb", // Gray for N/A placeholders
        placeholderText: "#6b7280", // Text for N/A
        placeholderSubtext: "#9ca3af", // Subtext for N/A
      };

      // Consistent spacing values throughout document
      const SPACING = {
        TINY: 5,
        SMALL: 20,
        MEDIUM: 40,
        LARGE: 60,
        XLARGE: 80,
      };

      // Damage marker consistency
      const DAMAGE_MARKER = {
        RADIUS: 10, // Consistent circle size
        FONT_SIZE: 9, // Consistent number font
        PADDING: 6, // Distance from edges
        BORDER_WIDTH: 1.5,
      };

      // A4 portrait 210×297mm with 18mm margins with compression for smaller file sizes
      const doc = new PDFDocument({
        margin: 51.02, // 18mm converted to points
        size: "A4",
        compress: true, // Enable PDF compression
        pdfVersion: "1.4", // Use PDF 1.4 for better compression support
        info: {
          Title: `${data.JOB_NUMBER} (POD)`,
          Author: "OVM Ltd",
          Subject: "Proof of Delivery - Flawless Layout",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));

      // Convert to async pattern for awaiting operations
      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
      });

      // Working image loading logic copied from gold standard service
      const safeUploadPath = (rel?: string | null) => {
        if (!rel) return undefined;
        const safe = rel.replace(/(\.\.[/\\])/g, "");
        return path.join(process.cwd(), "uploads", safe);
      };

      const openImageMeta = (absPath: string) => {
        try {
          const img = (doc as any).openImage(absPath);
          return { w: img.width as number, h: img.height as number };
        } catch {
          return null;
        }
      };

      const drawCover = (
        abs: string,
        fx: number,
        fy: number,
        fw: number,
        fh: number,
      ) => {
        const meta = openImageMeta(abs);
        if (!meta) return;
        const scale = Math.max(fw / meta.w, fh / meta.h);
        const w = meta.w * scale,
          h = meta.h * scale;
        const x = fx + (fw - w) / 2,
          y0 = fy + (fh - h) / 2;
        doc.save();
        doc.rect(fx, fy, fw, fh).clip();
        try {
          doc.image(abs, x, y0, { width: w, height: h });
        } catch {}
        doc.restore();
      };

      // 🚀 OPTIMIZATION: Pre-compressed image cache for parallel processing
      const imageCache = new Map<string, Buffer>();

      // 🚀 OPTIMIZATION: Parallel photo preprocessing before PDF generation
      const preprocessAllPhotos = async (photoArrays: string[][]) => {
        const allPhotos: Array<{
          buffer: Buffer;
          category: "pdf";
          id: string;
        }> = [];

        // Flatten all photo arrays and prepare for batch processing
        photoArrays.forEach((photos, arrayIndex) => {
          photos.forEach((photo, photoIndex) => {
            if (photo && photo.includes("data:image/")) {
              try {
                const base64Data = photo.split(",")[1];
                const buffer = Buffer.from(base64Data, "base64");
                allPhotos.push({
                  buffer,
                  category: "pdf",
                  id: `${arrayIndex}-${photoIndex}`,
                });
              } catch (error) {
                console.warn(
                  `⚠️ Failed to process photo ${arrayIndex}-${photoIndex}:`,
                  error,
                );
              }
            }
          });
        });

        if (allPhotos.length > 0) {
          console.log(
            `🚀 PARALLEL: Pre-processing ${allPhotos.length} photos in parallel...`,
          );
          const { ImageCompressionService } = await import(
            "./imageCompression"
          );
          const results =
            await ImageCompressionService.compressImageBatch(allPhotos);

          // Cache all compressed results
          results.forEach((result) => {
            imageCache.set(result.id, result.compressed);
          });

          console.log(
            `⚡ PARALLEL: All ${allPhotos.length} photos pre-compressed and cached!`,
          );
        }
      };

      // 🚀 PARALLEL OPTIMIZATION: Process ALL photos before PDF generation starts
      console.log(
        "⚡ PARALLEL: Pre-processing all photos for maximum speed...",
      );
      const allPhotoArrays = [
        data.EXTERIOR_PHOTOS || [],
        data.INTERIOR_PHOTOS || [],
        data.KEYS_V5_PHOTOS || [],
        data.FUEL_MILEAGE_PHOTOS || [],
        data.WHEELS_PHOTOS || [],
        data.DAMAGE_PHOTOS || [],
      ];
      await preprocessAllPhotos(allPhotoArrays);

      const framedImage = async (
        imageData: string | undefined,
        x0: number,
        y0: number,
        w0: number,
        h0: number,
        imageId?: string,
      ) => {
        // CONSISTENT CARD STYLE - Same as Collection/Delivery Address boxes
        doc.rect(x0, y0, w0, h0).fillColor(C.cardBg).fill();
        doc.rect(x0, y0, w0, h0).strokeColor(C.rules).lineWidth(1).stroke();

        if (!imageData) {
          // Clean placeholder with subtle pattern - consistent with card style
          doc
            .fontSize(10)
            .fillColor(C.text)
            .font("Helvetica")
            .text("Image not available", x0, y0 + h0 / 2 - 6, {
              width: w0,
              align: "center",
            });
          return;
        }

        try {
          // 🚀 OPTIMIZATION: Use pre-compressed image from cache if available
          if (imageId && imageCache.has(imageId)) {
            const compressedBuffer = imageCache.get(imageId)!;
            console.log(`⚡ Using cached compressed image: ${imageId}`);

            const maxWidth = Math.min(w0 - 4, 400);
            const maxHeight = Math.min(h0 - 4, 300);

            doc.image(compressedBuffer, x0 + 2, y0 + 2, {
              fit: [maxWidth, maxHeight] as [number, number],
              align: "center",
              valign: "center",
            });

            console.log("✅ Cached compressed image embedded in POC");
            return;
          }

          // Fallback to individual compression if not cached
          let base64Data = imageData;
          if (imageData.startsWith("data:image/")) {
            base64Data = imageData.split(",")[1];
          }

          const originalBuffer = Buffer.from(base64Data, "base64");
          console.log(
            `📄 Original image size: ${Math.round(originalBuffer.length / 1024)}KB`,
          );

          const { ImageCompressionService } = await import(
            "./imageCompression"
          );
          const compressed = await ImageCompressionService.compressImage(
            originalBuffer,
            "pdf",
            false,
          );

          console.log(
            `📄 Sharp compressed: ${Math.round(compressed.originalSize / 1024)}KB → ${Math.round(compressed.compressedSize / 1024)}KB (${Math.round((1 - compressed.compressionRatio) * 100)}% reduction)`,
          );

          const maxWidth = Math.min(w0 - 4, 400);
          const maxHeight = Math.min(h0 - 4, 300);

          doc.image(compressed.compressed, x0 + 2, y0 + 2, {
            fit: [maxWidth, maxHeight] as [number, number],
            align: "center",
            valign: "center",
          });

          console.log("✅ Sharp compressed + resized image embedded in POC");
        } catch (error) {
          console.error("❌ Failed to embed base64 image:", error);
          doc
            .fontSize(10)
            .fillColor(C.text)
            .font("Helvetica")
            .text("Image error", x0, y0 + h0 / 2 - 6, {
              width: w0,
              align: "center",
            });
        }
      };

      // PROFESSIONAL BLACK Vehicle Outline Drawing with Perfect Borders and Damage Markers
      const drawVehicleOutlineWithMarkers = (
        filename: string,
        x: number,
        y: number,
        width: number,
        height: number,
        view: string,
        markers: DamageMarker[],
      ) => {
        // BORDER BOX - EXACT SAME STYLING as other photo boxes (framedImage function)
        doc.rect(x, y, width, height).fillColor(C.cardBg).fill();
        doc
          .rect(x, y, width, height)
          .strokeColor(C.rules)
          .lineWidth(1)
          .stroke();

        // Load BLACK vehicle outline from assets folder
        const outlinePath = path.join(process.cwd(), "assets", filename);
        console.log(`🚗 Loading BLACK vehicle outline: ${outlinePath}`);

        // PERFECT FITTING - No stretching, proper aspect ratio
        const padding = 20;
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;

        if (fs.existsSync(outlinePath)) {
          try {
            // Draw image with EXACT fit to prevent stretching
            doc.image(outlinePath, x + padding, y + padding, {
              width: availableWidth,
              height: availableHeight,
              fit: [availableWidth, availableHeight],
              align: "center",
              valign: "center",
            });
            console.log(
              `✅ Successfully loaded BLACK vehicle outline: ${filename}`,
            );
          } catch (error) {
            console.error(
              `❌ Failed to load BLACK vehicle outline: ${outlinePath}`,
              error,
            );
            // Professional fallback
            doc
              .fontSize(10)
              .fillColor(C.text)
              .font("Helvetica")
              .text(
                "Vehicle outline unavailable",
                x + padding,
                y + height / 2 - 5,
                {
                  width: availableWidth,
                  align: "center",
                },
              );
          }
        } else {
          console.error(`❌ BLACK vehicle outline not found: ${outlinePath}`);
          // Professional fallback
          doc
            .fontSize(10)
            .fillColor(C.text)
            .font("Helvetica")
            .text(
              "Vehicle outline not found",
              x + padding,
              y + height / 2 - 5,
              {
                width: availableWidth,
                align: "center",
              },
            );
        }

        // SEQUENTIAL DAMAGE NUMBERING across all vehicle views
        const viewOrder = ["front", "rear", "driverSide", "passengerSide"];
        const currentViewIndex = viewOrder.indexOf(view);

        // Calculate starting number for this view based on previous views
        let startingNumber = 1;
        for (let i = 0; i < currentViewIndex; i++) {
          const previousViewMarkers = markers.filter(
            (m) => m.view === viewOrder[i],
          );
          startingNumber += previousViewMarkers.length;
        }

        // Draw damage markers with ORIGINAL positioning (reverted to working approach)
        const viewMarkers = markers.filter((m) => m.view === view);
        viewMarkers.forEach((marker, index) => {
          const padding = 20; // Back to original padding
          // Adjust marker position by 10% closer to center for better accuracy
          const baseX = x + padding + (marker.x / 100) * (width - padding * 2);
          const baseY = y + padding + (marker.y / 100) * (height - padding * 2);

          // Calculate 15% adjustment towards center
          const centerX = x + width / 2;
          const centerY = y + height / 2;
          const adjustX = (baseX - centerX) * 0.15;
          const adjustY = (baseY - centerY) * 0.15;

          const markerX = baseX - adjustX;
          const markerY = baseY - adjustY;
          const markerNumber = startingNumber + index;

          console.log(
            `🎯 Drawing marker ${markerNumber} on ${view} at (${markerX.toFixed(1)}, ${markerY.toFixed(1)}) - Input: (${marker.x.toFixed(2)}%, ${marker.y.toFixed(2)}%) - Box: ${width}x${height}px at (${x}, ${y})`,
          );

          // CONSISTENT damage marker styling
          doc.save();
          doc
            .circle(markerX, markerY, DAMAGE_MARKER.RADIUS)
            .fillColor(C.damageRed)
            .fill()
            .strokeColor(C.white)
            .lineWidth(DAMAGE_MARKER.BORDER_WIDTH)
            .stroke();

          // Centered number text
          const numberStr = markerNumber.toString();
          doc
            .fontSize(DAMAGE_MARKER.FONT_SIZE)
            .fillColor(C.white)
            .font("Helvetica-Bold");
          const textWidth = doc.widthOfString(numberStr);
          doc.text(numberStr, markerX - textWidth / 2, markerY - 3.5);
          doc.restore();
        });
      };

      // USER REQUESTED: Add descriptive boxes under all photos
      const framedImageWithLabel = async (
        rel: string | undefined,
        x0: number,
        y0: number,
        w0: number,
        h0: number,
        label: string,
        damageNumber?: number,
      ) => {
        // Draw the main photo
        await framedImage(rel, x0, y0, w0, h0);

        // Add red numbered circle if damage number provided (top-left of photo)
        if (damageNumber) {
          const numberStr = damageNumber.toString();
          const circleX = x0 + DAMAGE_MARKER.PADDING + DAMAGE_MARKER.RADIUS;
          const circleY = y0 + DAMAGE_MARKER.PADDING + DAMAGE_MARKER.RADIUS;

          // Red circle with white border - CONSISTENT styling
          doc
            .circle(circleX, circleY, DAMAGE_MARKER.RADIUS)
            .fillColor(C.damageRed)
            .fill();
          doc
            .circle(circleX, circleY, DAMAGE_MARKER.RADIUS)
            .strokeColor(C.white)
            .lineWidth(DAMAGE_MARKER.BORDER_WIDTH)
            .stroke();

          // White number text - perfectly centered
          doc
            .fontSize(DAMAGE_MARKER.FONT_SIZE)
            .font("Helvetica-Bold")
            .fillColor(C.white);
          const textWidth = doc.widthOfString(numberStr);
          doc.text(numberStr, circleX - textWidth / 2, circleY - 3.5);
        }

        // CONSISTENT CARD STYLE - Same as Collection Address boxes
        const boxY = y0 + h0 + SPACING.TINY;
        const boxHeight = 32;

        // Same styling as address cards for consistency
        doc.rect(x0, boxY, w0, boxHeight).fillColor(C.cardBg).fill();
        doc
          .rect(x0, boxY, w0, boxHeight)
          .strokeColor(C.rules)
          .lineWidth(1)
          .stroke();

        // Professional label text (USER REQUESTED: not bold)
        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor(C.text)
          .text(label, x0, boxY + 11, { width: w0, align: "center" });
      };

      // N/A placeholder for documents marked as not present
      const framedImageWithNALabel = async (
        x0: number,
        y0: number,
        w0: number,
        h0: number,
        label: string,
      ) => {
        // Gray background box for N/A placeholder
        doc.rect(x0, y0, w0, h0).fillColor(C.placeholderGray).fill();
        doc.rect(x0, y0, w0, h0).strokeColor(C.rules).lineWidth(1).stroke();

        // Large "N/A" text in center
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .fillColor(C.placeholderText)
          .text("N/A", x0, y0 + h0 / 2 - 20, { width: w0, align: "center" });

        // "Not Present" subtitle
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(C.placeholderSubtext)
          .text("Not Present", x0, y0 + h0 / 2 + 5, {
            width: w0,
            align: "center",
          });

        // Label box below (same as regular photos)
        const boxY = y0 + h0 + SPACING.TINY;
        const boxHeight = 32;
        doc.rect(x0, boxY, w0, boxHeight).fillColor(C.cardBg).fill();
        doc
          .rect(x0, boxY, w0, boxHeight)
          .strokeColor(C.rules)
          .lineWidth(1)
          .stroke();
        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor(C.text)
          .text(label, x0, boxY + 11, { width: w0, align: "center" });
      };

      const addFooter = (pageNum: number, totalPages: number) => {
        doc
          .fontSize(10)
          .fillColor(C.meta)
          .text(`Page ${pageNum} of ${totalPages}`, 0, doc.page.height - 40, {
            width: doc.page.width - 40,
            align: "right",
          });
      };

      let pageNum = 1;
      // Fixed 4-page layout: Cover, Exterior, Interior+Wheels, Keys+V5+Damage
      const totalPages = 4;

      // PAGE 1 - Professional Cover Page with Perfect Spacing
      let y = 40; // Start higher for logo

      // OVM Logo - TRY MULTIPLE LOCATIONS TO ENSURE SUCCESS
      const logoPaths = [
        path.join(
          process.cwd(),
          "attached_assets",
          "invoiceheaderlogo_1754920861250.png",
        ),
        path.join(
          process.cwd(),
          "attached_assets",
          "invoiceheaderlogo_1753992208625.png",
        ),
        path.join(process.cwd(), "assets", "ovm-logo.png"),
        path.join(process.cwd(), "client", "public", "ovm-logo.png"),
        path.join(process.cwd(), "server", "assets", "ovm-logo.png"),
      ];

      let logoLoaded = false;
      for (const logoPath of logoPaths) {
        console.log("🔍 Trying logo path:", logoPath);
        if (fs.existsSync(logoPath)) {
          try {
            const logoMaxWidth = 200;
            const logoHeight = 60;
            const logoX = (doc.page.width - logoMaxWidth) / 2;
            doc.image(logoPath, logoX, y, {
              fit: [logoMaxWidth, logoHeight],
              align: "center",
            });
            console.log("✅ Logo successfully loaded from:", logoPath);
            logoLoaded = true;
            y += logoHeight + 25;
            break;
          } catch (error) {
            console.log(
              "❌ Failed to load logo from",
              logoPath,
              ":",
              (error as Error).message,
            );
            continue;
          }
        }
      }

      if (!logoLoaded) {
        console.log("❌ No logo found, adding OVM placeholder");
        // Professional OVM text instead of box
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .fillColor(C.ovmBlue)
          .text("OVM", 0, y, { width: doc.page.width, align: "center" });
        y += 60;
      }

      // Title: "Proof of Delivery" - perfectly centered in BLACK text
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("PROOF OF DELIVERY", 0, y, {
          width: doc.page.width,
          align: "center",
        });
      y += 45;

      // Job Reference - smaller text, black color
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor(C.text)
        .text(`Job Reference: ${data.JOB_NUMBER}`, 0, y, {
          width: doc.page.width,
          align: "center",
        });
      y += 60;

      // FLAWLESS UNIFORM LAYOUT - ALL CARDS SAME STYLE
      const pageMargin = 51;
      const cardPadding = 15;
      const cardSpacing = 60; // USER REQUESTED: 50% wider gap (was 40px, now 60px)
      const cardHeight = 110;

      // Calculate perfect two-column layout with 40px gap
      const availableWidth = doc.page.width - pageMargin * 2;
      const colWidth = (availableWidth - cardSpacing) / 2;
      const leftX = pageMargin;
      const rightX = pageMargin + colWidth + cardSpacing;
      let addressY = y;

      // Collection Address - UNIFORM CARD STYLE
      doc
        .rect(
          leftX - cardPadding,
          addressY - cardPadding,
          colWidth + cardPadding * 2,
          cardHeight + cardPadding * 2,
        )
        .fillColor(C.cardBg)
        .fill();
      doc
        .rect(
          leftX - cardPadding,
          addressY - cardPadding,
          colWidth + cardPadding * 2,
          cardHeight + cardPadding * 2,
        )
        .strokeColor(C.rules)
        .lineWidth(1)
        .stroke();
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Collection Address", leftX, addressY);
      addressY += 25;
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor(C.text)
        .text(data.COLLECTION_ADDRESS.join("\n"), leftX, addressY, {
          width: colWidth - 20,
          lineGap: 4,
        });

      // Delivery Address - IDENTICAL CARD STYLE
      let deliveryY = y;
      doc
        .rect(
          rightX - cardPadding,
          deliveryY - cardPadding,
          colWidth + cardPadding * 2,
          cardHeight + cardPadding * 2,
        )
        .fillColor(C.cardBg)
        .fill();
      doc
        .rect(
          rightX - cardPadding,
          deliveryY - cardPadding,
          colWidth + cardPadding * 2,
          cardHeight + cardPadding * 2,
        )
        .strokeColor(C.rules)
        .lineWidth(1)
        .stroke();
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Delivery Address", rightX, deliveryY);
      deliveryY += 25;
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor(C.text)
        .text(data.DELIVERY_ADDRESS.join("\n"), rightX, deliveryY, {
          width: colWidth - 20,
          lineGap: 4,
        });

      y += cardHeight + 50; // Perfect spacing to vehicle section

      // Vehicle Details - SAME CARD STYLE AS ADDRESSES
      const vehicleCardHeight = 130;
      const fullWidth = availableWidth;
      doc
        .rect(
          leftX - cardPadding,
          y - cardPadding,
          fullWidth + cardPadding * 2,
          vehicleCardHeight + cardPadding * 2,
        )
        .fillColor(C.cardBg)
        .fill();
      doc
        .rect(
          leftX - cardPadding,
          y - cardPadding,
          fullWidth + cardPadding * 2,
          vehicleCardHeight + cardPadding * 2,
        )
        .strokeColor(C.rules)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Vehicle Information", leftX, y);
      y += 30;

      // UNIFORM vehicle details grid matching address cards
      const vehicleGrid = [
        ["Vehicle Make", data.VEHICLE_MAKE, "Registration", data.VEHICLE_REG],
        ["Mileage", data.VEHICLE_MILEAGE, "Fuel Level", data.VEHICLE_FUEL],
      ];

      vehicleGrid.forEach(([label1, value1, label2, value2]) => {
        // Left column - EXACT SAME styling as address cards
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(C.labels)
          .text(label1, leftX, y);
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(C.text)
          .text(value1, leftX, y + 16);

        // Right column - EXACT SAME styling as address cards
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(C.labels)
          .text(label2, rightX, y);
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(C.text)
          .text(value2, rightX, y + 16);

        y += 40; // Consistent spacing
      });

      // Add clear gap before Collection Conditions section
      y += 70; // Large visible gap to match spacing between other sections
      const conditionsCardHeight = 100;
      doc
        .rect(
          leftX - cardPadding,
          y - cardPadding,
          fullWidth + cardPadding * 2,
          conditionsCardHeight + cardPadding * 2,
        )
        .fillColor(C.cardBg)
        .fill();
      doc
        .rect(
          leftX - cardPadding,
          y - cardPadding,
          fullWidth + cardPadding * 2,
          conditionsCardHeight + cardPadding * 2,
        )
        .strokeColor(C.rules)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Collection Conditions", leftX, y);
      y += 30;

      // Display collection conditions in a clean grid
      const conditionsData = [
        {
          label: "Weather Conditions:",
          value: GoldStandardPODGenerationService.capitalizeCondition(
            data.WEATHER_CONDITIONS || "Dry",
          ),
        },
        {
          label: "Lighting Conditions:",
          value: GoldStandardPODGenerationService.capitalizeCondition(
            data.LIGHTING_CONDITIONS || "Good Light",
          ),
        },
        {
          label: "Vehicle Cleanliness:",
          value: GoldStandardPODGenerationService.capitalizeCondition(
            data.VEHICLE_CLEANLINESS || "Clean",
          ),
        },
      ];

      conditionsData.forEach((condition, index) => {
        const conditionY = y + index * 25;
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(C.labels)
          .text(condition.label, leftX, conditionY);
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(C.text)
          .text(condition.value, leftX + 100, conditionY);
      });

      y += conditionsCardHeight + 30;

      // 2×2 grid dimensions for all photo pages
      const gutter = 22.68;
      const contentWidth = doc.page.width - 102;
      const cellWidth = (contentWidth - gutter) / 2;
      const cellHeight = cellWidth * 0.75;

      // PAGE 2 - KEYS & VEHICLE DOCUMENTATION DEDICATED PAGE (2×2 grid)
      doc.addPage();
      pageNum++;
      y = 51;

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Vehicle Documentation", 51, y);
      y += 20;
      doc
        .moveTo(51, y)
        .lineTo(doc.page.width - 51, y)
        .strokeColor(C.text)
        .lineWidth(1)
        .stroke();
      y += 30;

      const keysV5Photos = data.KEYS_V5_PHOTOS || [];
      const fuelMileagePhotos = data.FUEL_MILEAGE_PHOTOS || [];
      const docPresence = data.DOCUMENT_PRESENCE || {
        hasKeys: true,
        hasV5: true,
        hasLockingWheelNut: true,
        hasServiceBook: true,
      };
      const docLabels = [
        "Keys",
        "V5",
        "Locking Wheel Nut",
        "Service Book",
        "Fuel Gauge",
        "Mileage",
      ];
      const docPresenceFlags = [
        docPresence.hasKeys,
        docPresence.hasV5,
        docPresence.hasLockingWheelNut,
        docPresence.hasServiceBook,
        true,
        true,
      ];

      // Show all 6 document slots: Keys, V5, Locking Wheel Nut, Service Book, Fuel Gauge, Mileage
      for (let i = 0; i < 6; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 51 + col * (cellWidth + gutter);
        const y2 = y + row * (cellHeight + 60); // Extra space for descriptive box

        // First 4 are from KEYS_V5_PHOTOS, last 2 are from FUEL_MILEAGE_PHOTOS
        const photoPath = i < 4 ? keysV5Photos[i] : fuelMileagePhotos[i - 4];
        const isPresent = docPresenceFlags[i];

        if (photoPath) {
          await framedImageWithLabel(
            photoPath,
            x,
            y2,
            cellWidth,
            cellHeight,
            docLabels[i],
          );
        } else if (!isPresent) {
          // Show N/A placeholder for documents marked as not present
          await framedImageWithNALabel(
            x,
            y2,
            cellWidth,
            cellHeight,
            docLabels[i],
          );
        } else {
          await framedImageWithLabel(
            undefined,
            x,
            y2,
            cellWidth,
            cellHeight,
            docLabels[i],
          );
        }
      }

      // PAGE 3 - EXTERIOR PHOTOS (2×2 grid)
      doc.addPage();
      pageNum++;
      y = 51;

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Exterior Vehicle Photos", 51, y);
      y += 20;
      doc
        .moveTo(51, y)
        .lineTo(doc.page.width - 51, y)
        .strokeColor(C.text)
        .lineWidth(1)
        .stroke();
      y += 30;

      const exteriorPhotos = data.EXTERIOR_PHOTOS || [];
      // Photo layout: Front|Rear (top), Driver Side|Passenger Side (bottom)
      const exteriorLabels = [
        "Front View",
        "Rear View",
        "Driver Side",
        "Passenger Side",
      ];
      for (let i = 0; i < Math.min(4, exteriorPhotos.length); i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 51 + col * (cellWidth + gutter);
        const y2 = y + row * (cellHeight + 60); // Extra space for descriptive box
        await framedImageWithLabel(
          exteriorPhotos[i],
          x,
          y2,
          cellWidth,
          cellHeight,
          exteriorLabels[i],
        );
      }

      // PAGE 4 - INTERIOR PHOTOS DEDICATED PAGE (2×2 grid)
      doc.addPage();
      pageNum++;
      y = 51;

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Interior Photos", 51, y);
      y += 20;
      doc
        .moveTo(51, y)
        .lineTo(doc.page.width - 51, y)
        .strokeColor(C.text)
        .lineWidth(1)
        .stroke();
      y += 30;

      const interiorPhotos = data.INTERIOR_PHOTOS || [];
      // Photo layout: Dashboard|Front Seats (top), Back Seats|Boot (bottom)
      const interiorLabels = [
        "Dashboard",
        "Front Seats",
        "Back Seats",
        "Boot Area",
      ];
      for (let i = 0; i < Math.min(4, interiorPhotos.length); i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 51 + col * (cellWidth + gutter);
        const y2 = y + row * (cellHeight + 60); // Extra space for descriptive box
        await framedImageWithLabel(
          interiorPhotos[i],
          x,
          y2,
          cellWidth,
          cellHeight,
          interiorLabels[i],
        );
      }

      // PAGE 5 - WHEELS & TYRES DEDICATED PAGE (2×2 grid)
      doc.addPage();
      pageNum++;
      y = 51;

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Wheels", 51, y);
      y += 20;
      doc
        .moveTo(51, y)
        .lineTo(doc.page.width - 51, y)
        .strokeColor(C.text)
        .lineWidth(1)
        .stroke();
      y += 30;

      const wheelsPhotos = data.WHEELS_PHOTOS || [];
      const wheelsStatus = data.WHEELS_STATUS || [];
      // Photo layout: Front Left|Front Right (top), Rear Left|Rear Right (bottom)
      const defaultLabels = [
        "Front Left",
        "Front Right",
        "Rear Left",
        "Rear Right",
      ];

      // Always show wheel status for all 4 positions, with or without photos
      for (let i = 0; i < 4; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 51 + col * (cellWidth + gutter);
        const y2 = y + row * (cellHeight + 60); // Extra space for descriptive box

        // Create label with wheel position only (removed scuffed status)
        const wheelStatus = wheelsStatus[i];
        const position = wheelStatus?.position || defaultLabels[i];
        const wheelLabel = position;

        // Use photo if available, otherwise show status card without photo
        const photoPath = wheelsPhotos[i];
        if (photoPath) {
          await framedImageWithLabel(
            photoPath,
            x,
            y2,
            cellWidth,
            cellHeight,
            wheelLabel,
          );
        } else {
          // Show status card without photo
          await framedImageWithLabel(
            undefined,
            x,
            y2,
            cellWidth,
            cellHeight,
            wheelLabel,
          );
        }
      }

      // Extract damage photos from individual damage markers first to determine if we need the page
      const damageMarkers = data.DAMAGE_MARKERS || [];
      const damagePhotos: string[] = [];

      // Flatten all photos from damage markers to maintain sequential numbering
      damageMarkers.forEach((marker) => {
        if (marker.photos && marker.photos.length > 0) {
          damagePhotos.push(...marker.photos);
        }
      });

      // PAGE 6 - PROFESSIONAL VEHICLE DAMAGE DOCUMENTATION (only if damage exists)
      if (damagePhotos.length > 0 || damageMarkers.length > 0) {
        doc.addPage();
        pageNum++;
        y = 51;

        // Professional header with OVM Blue styling
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .fillColor(C.text) // Black title
          .text("Vehicle Damage Areas", 51, y);
        y += 25;
        doc
          .moveTo(51, y)
          .lineTo(doc.page.width - 51, y)
          .strokeColor(C.text)
          .lineWidth(2)
          .stroke(); // Black underlines
        y += 35;

        // Vehicle outline diagrams (2x2 grid for main views)
        const outlineWidth = (contentWidth - gutter) / 2;
        const outlineHeight = outlineWidth * 0.6; // Maintain aspect ratio

        const outlineViews = [
          { view: "front", file: "car-front-black.png", label: "Front View" },
          { view: "rear", file: "car-rear-black.png", label: "Rear View" },
          {
            view: "driverSide",
            file: "car-driver-side-black.png",
            label: "Driver Side",
          },
          {
            view: "passengerSide",
            file: "car-passenger-side-black.png",
            label: "Passenger Side",
          },
        ];

        for (let i = 0; i < outlineViews.length; i++) {
          const row = Math.floor(i / 2);
          const col = i % 2;
          const x = 51 + col * (outlineWidth + gutter);
          const y2 = y + row * (outlineHeight + 60);

          drawVehicleOutlineWithMarkers(
            outlineViews[i].file,
            x,
            y2,
            outlineWidth,
            outlineHeight,
            outlineViews[i].view,
            damageMarkers,
          );

          // Label under outline
          const labelY = y2 + outlineHeight + SPACING.TINY;
          doc.rect(x, labelY, outlineWidth, 25).fillColor(C.cardBg).fill();
          doc
            .rect(x, labelY, outlineWidth, 25)
            .strokeColor(C.rules)
            .lineWidth(1)
            .stroke();
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(C.text)
            .text(outlineViews[i].label, x, labelY + 8, {
              width: outlineWidth,
              align: "center",
            });
        }

        y += (outlineHeight + 85) * 2; // Move past outlines
      }

      // PAGE 7 - VEHICLE DAMAGE IMAGES (separate page for actual damage photos with numbers)
      // Build ordered markers first, then photo-marker pairs using SAME ordering as outline page
      const viewOrder = ["front", "rear", "driverSide", "passengerSide"];
      const orderedMarkers = viewOrder.flatMap((view) =>
        damageMarkers.filter((m: any) => m.view === view),
      );

      // Build photo-marker pairs with correct sequential numbering
      const orderedPhotoMarkerPairs: Array<{
        photo: string;
        markerNumber: number;
        marker: any;
      }> = [];
      orderedMarkers.forEach((marker: any, markerIndex: number) => {
        const markerNumber = markerIndex + 1; // Sequential marker numbering
        if (
          marker.photos &&
          Array.isArray(marker.photos) &&
          marker.photos.length > 0
        ) {
          marker.photos.forEach((photo: string) => {
            orderedPhotoMarkerPairs.push({ photo, markerNumber, marker });
          });
        }
      });

      // Add this page if there are damage markers (with or without photos)
      if (orderedMarkers.length > 0) {
        doc.addPage();
        pageNum++;
        y = 51;

        // Professional header with black styling
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .fillColor(C.text)
          .text("Vehicle Damage Images", 51, y);
        y += 25;
        doc
          .moveTo(51, y)
          .lineTo(doc.page.width - 51, y)
          .strokeColor(C.text)
          .lineWidth(2)
          .stroke(); // Black underlines
        y += 35;

        if (orderedPhotoMarkerPairs.length > 0) {
          // Grid layout for damage photos
          const photosPerRow = 2;
          const photoWidth = (contentWidth - gutter) / photosPerRow;
          const photoHeight = photoWidth * 0.75;

          for (let i = 0; i < orderedPhotoMarkerPairs.length; i++) {
            const row = Math.floor(i / photosPerRow);
            const col = i % photosPerRow;
            const x = 51 + col * (photoWidth + gutter);
            const y2 = y + row * (photoHeight + 100); // Extra space for numbered circle and description

            const pair = orderedPhotoMarkerPairs[i];

            // Display the damage photo
            await framedImage(pair.photo, x, y2, photoWidth, photoHeight);

            // Add red numbered circle matching the marker numbers from outline page - CONSISTENT styling
            const numberText = pair.markerNumber.toString();
            const circleX = x + DAMAGE_MARKER.PADDING + DAMAGE_MARKER.RADIUS;
            const circleY = y2 + DAMAGE_MARKER.PADDING + DAMAGE_MARKER.RADIUS;

            // Red circle with white border - CONSISTENT styling
            doc
              .circle(circleX, circleY, DAMAGE_MARKER.RADIUS)
              .fillColor(C.damageRed)
              .fill();
            doc
              .circle(circleX, circleY, DAMAGE_MARKER.RADIUS)
              .strokeColor(C.white)
              .lineWidth(DAMAGE_MARKER.BORDER_WIDTH)
              .stroke();

            // White number text - perfectly centered
            doc
              .fontSize(DAMAGE_MARKER.FONT_SIZE)
              .font("Helvetica-Bold")
              .fillColor(C.white);
            const textWidth = doc.widthOfString(numberText);
            doc.text(numberText, circleX - textWidth / 2, circleY - 3.5);

            // Description box below photo - Same card style as other sections
            const descBoxY = y2 + photoHeight + 8;
            const descBoxHeight = 80;

            doc
              .rect(x, descBoxY, photoWidth, descBoxHeight)
              .fillColor(C.cardBg)
              .fill();
            doc
              .rect(x, descBoxY, photoWidth, descBoxHeight)
              .strokeColor(C.rules)
              .lineWidth(1)
              .stroke();

            // Damage details from the correctly matched marker
            const marker = pair.marker;
            const typeLabel =
              (marker.type || marker.damageType || "damage")
                .charAt(0)
                .toUpperCase() +
              (marker.type || marker.damageType || "damage").slice(1);
            const sizeLabel =
              (marker.size || "medium").charAt(0).toUpperCase() +
              (marker.size || "medium").slice(1);
            const viewLabel =
              marker.view === "driverSide"
                ? "Driver Side"
                : marker.view === "passengerSide"
                  ? "Passenger Side"
                  : marker.view === "front"
                    ? "Front"
                    : marker.view === "rear"
                      ? "Rear"
                      : "Unknown";

            doc
              .fontSize(12)
              .font("Helvetica-Bold")
              .fillColor(C.text)
              .text(
                `Damage ${pair.markerNumber}: ${typeLabel}`,
                x + 12,
                descBoxY + 12,
              );
            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor(C.text)
              .text(
                `Size: ${sizeLabel} | Location: ${viewLabel}`,
                x + 12,
                descBoxY + 32,
              );
            if (marker.description) {
              doc
                .fontSize(9)
                .font("Helvetica")
                .fillColor(C.text)
                .text(`Notes: ${marker.description}`, x + 12, descBoxY + 50);
            }
          }
        } else {
          // Show damage markers info even without photos
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor(C.text)
            .text("Damage Areas Identified", 51, y);
          y += 30;

          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(C.text)
            .text(
              "The following damage areas were marked on the vehicle outline in the previous section:",
              51,
              y,
            );
          y += 25;

          // List each damage marker with details
          orderedMarkers.forEach((marker: any, index: number) => {
            const markerNumber = index + 1;
            const typeLabel =
              (marker.type || marker.damageType || "damage")
                .charAt(0)
                .toUpperCase() +
              (marker.type || marker.damageType || "damage").slice(1);
            const sizeLabel =
              (marker.size || "medium").charAt(0).toUpperCase() +
              (marker.size || "medium").slice(1);
            const viewLabel =
              marker.view === "driverSide"
                ? "Driver Side"
                : marker.view === "passengerSide"
                  ? "Passenger Side"
                  : marker.view === "front"
                    ? "Front"
                    : "Rear";

            // Damage marker card
            const cardY = y;
            const cardHeight = 80;
            const cardWidth = contentWidth;

            doc
              .rect(51, cardY, cardWidth, cardHeight)
              .fillColor(C.cardBg)
              .fill();
            doc
              .rect(51, cardY, cardWidth, cardHeight)
              .strokeColor(C.rules)
              .lineWidth(1)
              .stroke();

            // Damage number and type
            doc
              .fontSize(12)
              .font("Helvetica-Bold")
              .fillColor(C.text)
              .text(
                `Damage ${markerNumber}: ${typeLabel}`,
                51 + 12,
                cardY + 12,
              );

            // Size and location
            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor(C.meta)
              .text(
                `Size: ${sizeLabel} | Location: ${viewLabel}`,
                51 + 12,
                cardY + 32,
              );

            // Description if available
            if (marker.description) {
              doc
                .fontSize(9)
                .font("Helvetica")
                .fillColor(C.labels)
                .text(`Notes: ${marker.description}`, 51 + 12, cardY + 50);
            }

            y += cardHeight + 15;
          });

          // 🔥 CRITICAL FIX: ADD SEPARATE NUMBERED DAMAGE PHOTOS PAGE
          if (damagePhotos.length > 0) {
            doc.addPage();
            pageNum++;
            y = 51;

            // Professional header
            doc
              .fontSize(18)
              .font("Helvetica-Bold")
              .fillColor(C.text)
              .text("Damage Photo Evidence", 51, y);
            y += 25;
            doc
              .moveTo(51, y)
              .lineTo(doc.page.width - 51, y)
              .strokeColor(C.text)
              .lineWidth(2)
              .stroke(); // Black underlines
            y += 45;

            // Show each numbered damage photo
            let photoNumber = 1;
            damagePhotos.forEach((photo, index) => {
              if (y > doc.page.height - 300) {
                // Check if we need new page
                doc.addPage();
                pageNum++;
                y = 51;
              }

              // Photo number title
              doc
                .fontSize(14)
                .font("Helvetica-Bold")
                .fillColor(C.text)
                .text(`Damage Photo (${photoNumber})`, 51, y);
              y += 30;

              // Large damage photo
              const photoWidth = 400;
              const photoHeight = 300;
              const photoX = (doc.page.width - photoWidth) / 2;

              try {
                let base64Data = photo;
                if (photo.startsWith("data:image/")) {
                  base64Data = photo.split(",")[1];
                }

                const imageBuffer = Buffer.from(base64Data, "base64");

                // Draw frame
                doc
                  .rect(photoX, y, photoWidth, photoHeight)
                  .fillColor(C.cardBg)
                  .fill()
                  .strokeColor(C.rules)
                  .lineWidth(1)
                  .stroke();

                // Draw image
                doc.image(imageBuffer, photoX + 5, y + 5, {
                  fit: [photoWidth - 10, photoHeight - 10],
                  align: "center",
                  valign: "center",
                });

                console.log(
                  `✅ Damage photo ${photoNumber} embedded successfully`,
                );
              } catch (error) {
                console.error(
                  `❌ Failed to embed damage photo ${photoNumber}:`,
                  error,
                );
                doc
                  .fontSize(12)
                  .fillColor(C.text)
                  .text(
                    `Damage photo ${photoNumber} - Failed to load`,
                    photoX,
                    y + photoHeight / 2,
                    {
                      width: photoWidth,
                      align: "center",
                    },
                  );
              }

              y += photoHeight + 40;
              photoNumber++;
            });
          }
        }
      } // Close main if (damagePhotos.length > 0 || damageMarkers.length > 0) condition

      // PAGE 8 - CUSTOMER CONFIRMATION SECTION (Point of Contact & Signature)
      doc.addPage();
      pageNum++;
      y = 51;

      // Professional header in black as requested
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Collection Information", 51, y);
      y += 25;
      doc
        .moveTo(51, y)
        .lineTo(doc.page.width - 51, y)
        .strokeColor(C.text)
        .lineWidth(2)
        .stroke(); // Black underline
      y += 45;

      // Point of Contact Details - Same card style as addresses
      const confirmCardPadding = 12;
      const confirmCardHeight = 280; // Increased to fit name + date + signature
      const confirmFullWidth = availableWidth; // Use same width as other pages

      doc
        .rect(
          51,
          y - confirmCardPadding,
          confirmFullWidth,
          confirmCardHeight + confirmCardPadding * 2,
        )
        .fillColor(C.cardBg)
        .fill();
      doc
        .rect(
          51,
          y - confirmCardPadding,
          confirmFullWidth,
          confirmCardHeight + confirmCardPadding * 2,
        )
        .strokeColor(C.rules)
        .lineWidth(1)
        .stroke();

      const textX = 51 + confirmCardPadding; // Add internal padding like page 1

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Collection Confirmation Details", textX, y);
      y += 30;

      // Point of Contact Name - Customer representative who signed at collection
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(C.labels)
        .text("Point of Contact Name:", textX, y);
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text(
          data.CUSTOMER_NAME ||
            data.POINT_OF_CONTACT_NAME ||
            "Name not provided",
          textX,
          y + 16,
        );

      // Collection Date & Time - use actual data from collection process, no fallback to current time
      const collectionDate = data.COLLECTION_DATE || "Date TBC";
      const collectionTime = data.COLLECTION_TIME || "Time TBC";

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(C.labels)
        .text("Collection Date & Time:", textX, y + 40);
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text(`${collectionDate} at ${collectionTime}`, textX, y + 56);

      // Digital Signature - now part of confirmation details
      y += SPACING.XLARGE + SPACING.SMALL;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(C.labels)
        .text("Digital Signature:", textX, y);
      y += 20;

      // Display actual customer signature if available
      console.log(
        "🔍 DEBUG: Signature data provided:",
        !!data.customerSignature,
        data.customerSignature
          ? `${data.customerSignature.substring(0, 50)}...`
          : "None",
      );
      if (data.customerSignature && data.customerSignature.trim()) {
        const sigBoxX = textX;
        const sigBoxY = y;
        const sigBoxW = 480;
        const sigBoxH = 100;

        try {
          // Handle both base64 data URLs and raw base64
          let signatureData = data.customerSignature;
          if (signatureData.startsWith("data:image/")) {
            signatureData = signatureData.split(",")[1];
          }

          // Convert base64 to buffer and draw image
          const signatureBuffer = Buffer.from(signatureData, "base64");
          doc.image(signatureBuffer, sigBoxX, sigBoxY, {
            fit: [sigBoxW, sigBoxH],
          });

          console.log(
            "✅ Customer signature drawn successfully in Flawless POC",
          );
        } catch (error) {
          console.error(
            "❌ Failed to draw customer signature in Flawless POC:",
            error,
          );
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(C.text)
            .text(
              "Digital signature captured but cannot display",
              sigBoxX,
              sigBoxY + 40,
              {
                width: sigBoxW,
                align: "left",
              },
            );
        }
      } else {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(C.placeholderSubtext)
          .text("No signature captured", textX, y);
      }

      y += 184;

      // Additional Notes Section - Always shown (second box)
      const notesCardHeight = 120;
      doc
        .rect(
          51,
          y - confirmCardPadding,
          confirmFullWidth,
          notesCardHeight + confirmCardPadding * 2,
        )
        .fillColor(C.cardBg)
        .fill();
      doc
        .rect(
          51,
          y - confirmCardPadding,
          confirmFullWidth,
          notesCardHeight + confirmCardPadding * 2,
        )
        .strokeColor(C.rules)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(C.text)
        .text("Additional Notes", textX, y);
      y += 30;

      if (data.DRIVER_ADDITIONAL_NOTES && data.DRIVER_ADDITIONAL_NOTES.trim()) {
        console.log("✅ Rendering driver notes:", data.DRIVER_ADDITIONAL_NOTES);
        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor(C.text)
          .text(data.DRIVER_ADDITIONAL_NOTES.trim(), textX, y, {
            width: confirmFullWidth - confirmCardPadding * 2,
            align: "left",
            lineGap: 4,
          });
      } else {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(C.placeholderSubtext)
          .text("No additional notes provided", textX, y);
      }

      y += notesCardHeight + 20;

      // Legal disclaimer text as requested by user
      y += SPACING.SMALL;
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(C.text)
        .text(
          "OVM Ltd’s responsibility is limited solely to the safe transportation of the vehicle to the agreed delivery address. OVM Ltd accepts no liability for any pre-existing defects, or for any damage sustained during transit to glass or tyres. OVM Ltd also accepts no responsibility for any electrical or mechanical faults, including but not limited to warning lights such as engine management, or for any subsequent electrical or mechanical failures that may occur during or after transit.",
          51,
          y,
          {
            width: confirmFullWidth,
            align: "justify",
          },
        );

      // Professional footer note
      y += 120;
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(C.text)
        .text(
          "© 2025 OVM Ltd | Company Number: SC834621 | Email: info@ovmtransport.com | Phone: 0141 459 1302",
          51,
          y,
          {
            width: confirmFullWidth,
            align: "center",
          },
        );

      doc.end();
      return await pdfPromise;
    } catch (error) {
      throw error;
    }
  }
}
