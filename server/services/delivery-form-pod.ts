import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import type {
  Job,
  Customer,
  Vehicle,
  Driver,
  JobProcessRecord,
  Photo,
  DamageReport,
} from "../../shared/schema";

export interface DeliveryFormPODData {
  job: Job & { customer?: Customer; vehicle?: Vehicle; driver?: Driver };
  processRecord: JobProcessRecord;
  photos: Photo[];
  damageReports: DamageReport[];
  customerName: string;
  customerSignature: string;
  actualDeliveryPhotos: {
    frontView?: string;
    rearView?: string;
    driverSide?: string;
    passengerSide?: string;
    dashboard?: string;
    odometer?: string;
    fuelGauge?: string;
    keys?: string;
  };
}

export class DeliveryFormPODService {
  private static readonly COMPANY_INFO = {
    name: "OVM Ltd",
    address: "272 Bath Street, Glasgow, G2 4JR",
    phone: "0141 459 1302",
    email: "info@ovmtransport.com",
    companyNumber: "SC834621",
  };

  private static readonly COLORS = {
    primary: "#1a365d",
    secondary: "#2d3748",
    accent: "#f7fafc",
    border: "#e2e8f0",
    text: "#2d3748",
    headerBg: "#f8f9fa",
  };

  static async generateDeliveryFormPOD(
    data: DeliveryFormPODData,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 20,
          bufferPages: true,
          autoFirstPage: false,
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // COMPLETE POD WITH ALL DRIVER DATA
        doc.addPage();
        this.drawCompletePOD(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawCompletePOD(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
  ) {
    let yPos = 20;

    // Professional header with real logo
    yPos = this.drawProfessionalHeader(doc, yPos);

    // Document title
    yPos = this.drawDocumentTitle(doc, yPos);

    // Job & Vehicle Information
    yPos = this.drawJobVehicleSection(doc, data, yPos);

    // Delivery Details & Environmental Conditions
    yPos = this.drawDeliveryDetailsSection(doc, data, yPos);

    // Complete Equipment Checklist (ALL fields from schema)
    yPos = this.drawCompleteEquipmentChecklist(doc, data, yPos);

    // Vehicle Photos with REAL embedded images
    yPos = this.drawVehiclePhotosSection(doc, data, yPos);

    // Damage Reports with damage photos
    yPos = this.drawDamageReportsSection(doc, data, yPos);

    // Customer Satisfaction Rating
    yPos = this.drawCustomerSatisfactionSection(doc, data, yPos);

    // Customer Acknowledgment & Signatures
    yPos = this.drawSignatureSection(doc, data, yPos);

    // Professional footer
    this.drawFooter(doc);
  }

  private static drawProfessionalHeader(
    doc: PDFKit.PDFDocument,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;

    // Try to load the real logo
    const logoPath = "./attached_assets/invoiceheaderlogo_1753992208625.png";
    let logoWidth = 120;
    let logoHeight = 40;

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, margin, yPos, {
          width: logoWidth,
          height: logoHeight,
        });
      } catch (error) {
        // Fallback to text logo if image fails
        this.drawTextLogo(doc, margin, yPos);
      }
    } else {
      this.drawTextLogo(doc, margin, yPos);
    }

    // Company details - right aligned
    const companyDetailsX = pageWidth - margin - 180;
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(this.COMPANY_INFO.address, companyDetailsX, yPos, {
        width: 180,
        align: "right",
      })
      .text(`Tel: ${this.COMPANY_INFO.phone}`, companyDetailsX, yPos + 15, {
        width: 180,
        align: "right",
      })
      .text(this.COMPANY_INFO.email, companyDetailsX, yPos + 30, {
        width: 180,
        align: "right",
      })
      .text(
        `Company No: ${this.COMPANY_INFO.companyNumber}`,
        companyDetailsX,
        yPos + 45,
        { width: 180, align: "right" },
      );

    return yPos + 60;
  }

  private static drawTextLogo(doc: PDFKit.PDFDocument, x: number, y: number) {
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.primary)
      .text("OVM", x, y);

    doc
      .fontSize(18)
      .font("Helvetica")
      .fillColor("#666")
      .text("Ltd", x + 55, y + 4);
  }

  private static drawDocumentTitle(
    doc: PDFKit.PDFDocument,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.primary)
      .text("PROOF OF DELIVERY", margin, yPos, {
        width: pageWidth - 2 * margin,
        align: "center",
      });

    return yPos + 30;
  }

  private static drawJobVehicleSection(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;
    const sectionWidth = pageWidth - 2 * margin;

    // Two-column layout
    const colWidth = sectionWidth / 2 - 10;
    const leftCol = margin;
    const rightCol = margin + colWidth + 20;

    // Job Details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("JOB DETAILS", leftCol, yPos);

    doc.fontSize(9).font("Helvetica").fillColor(this.COLORS.text);

    const jobY = yPos + 18;
    doc.text(`Job Number: ${data.job.jobNumber}`, leftCol, jobY);

    const deliveryDate = data.processRecord?.createdAt
      ? new Date(data.processRecord.createdAt).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

    doc.text(`Delivery Date: ${deliveryDate}`, leftCol, jobY + 12);
    doc.text(
      `Customer: ${data.job.customer?.name || "Customer"}`,
      leftCol,
      jobY + 24,
    );
    doc.text(`Delivery Address:`, leftCol, jobY + 36);

    const address = data.job.deliveryAddress;
    if (address) {
      doc.text(`${address.line1}`, leftCol + 5, jobY + 48);
      if (address.line2) {
        doc.text(`${address.line2}`, leftCol + 5, jobY + 60);
        doc.text(`${address.city} ${address.postcode}`, leftCol + 5, jobY + 72);
      } else {
        doc.text(`${address.city} ${address.postcode}`, leftCol + 5, jobY + 60);
      }
    }

    // Vehicle Details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("VEHICLE DETAILS", rightCol, yPos);

    doc.fontSize(9).font("Helvetica").fillColor(this.COLORS.text);

    const vehicleY = yPos + 18;
    doc.text(
      `Registration: ${data.job.vehicle?.registration || "TBC"}`,
      rightCol,
      vehicleY,
    );
    doc.text(
      `Make/Model: ${data.job.vehicle?.make || "TBC"} ${data.job.vehicle?.model || ""}`,
      rightCol,
      vehicleY + 12,
    );
    doc.text(
      `Year: ${data.job.vehicle?.year || "TBC"}`,
      rightCol,
      vehicleY + 24,
    );
    doc.text(
      `Colour: ${data.job.vehicle?.colour || "TBC"}`,
      rightCol,
      vehicleY + 36,
    );
    doc.text(
      `Fuel Type: ${data.job.vehicle?.fuelType || "TBC"}`,
      rightCol,
      vehicleY + 48,
    );
    doc.text(
      `MOT Status: ${data.job.vehicle?.motStatus || "N/A"}`,
      rightCol,
      vehicleY + 60,
    );

    return yPos + 95;
  }

  private static drawDeliveryDetailsSection(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;
    const sectionWidth = pageWidth - 2 * margin;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("DELIVERY DETAILS & CONDITIONS", margin, yPos);

    yPos += 18;

    doc.fontSize(9).font("Helvetica").fillColor(this.COLORS.text);

    // Three-column layout
    const col1 = margin;
    const col2 = margin + sectionWidth / 3;
    const col3 = margin + (2 * sectionWidth) / 3;

    // Column 1 - Basic Details
    doc.text(
      `Mileage Reading: ${data.processRecord?.mileageReading || "Recorded"}`,
      col1,
      yPos,
    );

    let fuelDisplay = "N/A";
    if (
      data.processRecord?.fuelLevel !== null &&
      data.processRecord?.fuelLevel !== undefined
    ) {
      const levels = ["Empty", "1/4", "1/2", "3/4", "Full"];
      fuelDisplay = levels[data.processRecord.fuelLevel] || "N/A";
    }
    doc.text(`Fuel Level: ${fuelDisplay}`, col1, yPos + 12);

    if (
      data.processRecord?.chargeLevel !== null &&
      data.processRecord?.chargeLevel !== undefined
    ) {
      const levels = ["Empty", "1/4", "1/2", "3/4", "Full"];
      const chargeDisplay = levels[data.processRecord.chargeLevel] || "N/A";
      doc.text(`Charge Level: ${chargeDisplay}`, col1, yPos + 24);
    }

    doc.text(
      `Keys: ${data.processRecord?.numberOfKeys || "2"}`,
      col1,
      yPos + 36,
    );

    // Column 2 - Environmental
    doc.text(
      `Weather: ${data.processRecord?.weatherCondition || "Good"}`,
      col2,
      yPos,
    );
    doc.text(
      `Wet Conditions: ${data.processRecord?.isWet ? "Yes" : "No"}`,
      col2,
      yPos + 12,
    );
    doc.text(
      `Dark Conditions: ${data.processRecord?.isDark ? "Yes" : "No"}`,
      col2,
      yPos + 24,
    );

    // Column 3 - Time
    const deliveryTime = data.processRecord?.createdAt
      ? new Date(data.processRecord.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

    doc.text(`Delivery Time: ${deliveryTime}`, col3, yPos);
    doc.text(
      `Customer: ${data.processRecord?.customerName || data.customerName}`,
      col3,
      yPos + 12,
    );

    return yPos + 55;
  }

  private static drawCompleteEquipmentChecklist(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;
    const sectionWidth = pageWidth - 2 * margin;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("COMPLETE VEHICLE DELIVERY CHECKLIST", margin, yPos);

    yPos += 20;

    // Two-column checklist with ALL fields from schema
    const leftCol = margin;
    const rightCol = margin + sectionWidth / 2;

    doc.fontSize(8).font("Helvetica").fillColor(this.COLORS.text);

    const leftItems = [
      {
        label: "Spare Wheel Present",
        checked: data.processRecord?.spareWheelPresent !== false,
      },
      {
        label: "Jack Present",
        checked: data.processRecord?.jackPresent !== false,
      },
      {
        label: "Tools Present",
        checked: data.processRecord?.toolsPresent !== false,
      },
      {
        label: "Locking Wheel Nut",
        checked: data.processRecord?.lockingWheelNutPresent !== false,
      },
      {
        label: "Charging Cables",
        checked: data.processRecord?.chargingCablesPresent !== false,
      },
      {
        label: "SatNav Working",
        checked: data.processRecord?.satNavWorking !== false,
      },
      {
        label: "Vehicle Delivery Pack",
        checked: data.processRecord?.vehicleDeliveryPackPresent !== false,
      },
      {
        label: "Number Plates Match",
        checked: data.processRecord?.numberPlatesMatch !== false,
      },
      {
        label: "Headrests Present",
        checked: data.processRecord?.headrestsPresent !== false,
      },
      {
        label: "Parcel Shelf Present",
        checked: data.processRecord?.parcelShelfPresent !== false,
      },
    ];

    const rightItems = [
      {
        label: "V5 Document Present",
        checked: data.processRecord?.v5Present !== false,
      },
      {
        label: "No Warning Lights",
        checked: data.processRecord?.warningLightsOn !== true,
      },
      {
        label: "Handbook/Service Book",
        checked: data.processRecord?.handbookServiceBookPresent !== false,
      },
      {
        label: "Mats in Place",
        checked: data.processRecord?.matsInPlace !== false,
      },
      {
        label: "Vehicle Clean Internally",
        checked: data.processRecord?.vehicleCleanInternally !== false,
      },
      {
        label: "Vehicle Clean Externally",
        checked: data.processRecord?.vehicleCleanExternally !== false,
      },
      {
        label: "No Internal Damage",
        checked: data.processRecord?.vehicleFreeDamageInternally !== false,
      },
      {
        label: "No External Damage",
        checked: data.processRecord?.vehicleFreeDamageExternally !== false,
      },
      {
        label: "Delivered Right Place/Time",
        checked: data.processRecord?.collectedRightPlaceTime !== false,
      },
      {
        label: "Handover Accepted",
        checked: data.processRecord?.handoverAccepted !== false,
      },
    ];

    leftItems.forEach((item, index) => {
      const itemY = yPos + index * 12;
      this.drawCheckbox(doc, leftCol, itemY, item.checked);
      doc.text(item.label, leftCol + 15, itemY - 1);
    });

    rightItems.forEach((item, index) => {
      const itemY = yPos + index * 12;
      this.drawCheckbox(doc, rightCol, itemY, item.checked);
      doc.text(item.label, rightCol + 15, itemY - 1);
    });

    return yPos + 130;
  }

  private static drawVehiclePhotosSection(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("VEHICLE PHOTOS AT DELIVERY", margin, yPos);

    yPos += 20;

    const photoWidth = 110;
    const photoHeight = 80;
    const photoSpacing = 15;

    const photos = [
      { label: "Front View", key: "frontView" },
      { label: "Rear View", key: "rearView" },
      { label: "Driver Side", key: "driverSide" },
      { label: "Passenger Side", key: "passengerSide" },
    ];

    // Draw photos in 2x2 grid with REAL images
    photos.forEach((photo, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = margin + col * (photoWidth + photoSpacing + 40);
      const photoY = yPos + row * (photoHeight + 25);

      // Photo label
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(this.COLORS.text)
        .text(photo.label, xPos, photoY, {
          width: photoWidth,
          align: "center",
        });

      // Photo frame
      doc
        .rect(xPos, photoY + 12, photoWidth, photoHeight)
        .fillAndStroke("#ffffff", this.COLORS.border);

      // Try to embed REAL photo
      const photoPath =
        data.actualDeliveryPhotos[
          photo.key as keyof typeof data.actualDeliveryPhotos
        ];

      if (photoPath && fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, xPos + 2, photoY + 14, {
            width: photoWidth - 4,
            height: photoHeight - 4,
            fit: [photoWidth - 4, photoHeight - 4],
          });
        } catch (error) {
          doc
            .fontSize(8)
            .fillColor("#666")
            .text("Photo Available", xPos + 2, photoY + 50, {
              width: photoWidth - 4,
              align: "center",
            });
        }
      } else {
        // Check for photos in database
        const matchingPhoto = data.photos?.find(
          (p) =>
            p.category === photo.key ||
            p.filename?.toLowerCase().includes(photo.key.toLowerCase()) ||
            p.stage === "delivery",
        );

        if (matchingPhoto?.filename) {
          doc
            .fontSize(8)
            .fillColor("#666")
            .text("Photo Captured", xPos + 2, photoY + 50, {
              width: photoWidth - 4,
              align: "center",
            });
        } else {
          doc
            .fontSize(8)
            .fillColor("#999")
            .text("No Photo", xPos + 2, photoY + 50, {
              width: photoWidth - 4,
              align: "center",
            });
        }
      }
    });

    return yPos + 2 * (photoHeight + 25) + 10;
  }

  private static drawDamageReportsSection(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const deliveryDamages =
      data.damageReports?.filter((d) => d.stage === "delivery") || [];

    if (deliveryDamages.length === 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(this.COLORS.secondary)
        .text(
          "VEHICLE CONDITION AT DELIVERY: NO NEW DAMAGES REPORTED",
          margin,
          yPos,
        );
      return yPos + 20;
    }

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("DELIVERY DAMAGE REPORTS", margin, yPos);

    yPos += 20;

    doc.fontSize(9).font("Helvetica").fillColor(this.COLORS.text);

    deliveryDamages.forEach((damage, index) => {
      doc.text(
        `${index + 1}. Panel: ${damage.panel} | Type: ${damage.damageType}`,
        margin,
        yPos,
      );
      if (damage.notes) {
        doc.text(`   Notes: ${damage.notes}`, margin, yPos + 12);
        yPos += 24;
      } else {
        yPos += 15;
      }
    });

    // Check for damage photos
    const damagePhotos =
      data.photos?.filter(
        (p) => p.category === "damage" && p.stage === "delivery",
      ) || [];
    if (damagePhotos.length > 0) {
      doc.text(
        `Damage Photos: ${damagePhotos.length} photos captured`,
        margin,
        yPos,
      );
      yPos += 15;
    }

    return yPos + 10;
  }

  private static drawCustomerSatisfactionSection(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("CUSTOMER SATISFACTION RATING", margin, yPos);

    yPos += 20;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(
        "Overall satisfaction with delivery service (1-5 scale):",
        margin,
        yPos,
      );

    // Draw rating scale
    const rating = data.processRecord?.customerSatisfactionRating || 5;
    const startX = margin + 250;

    for (let i = 1; i <= 5; i++) {
      const circleX = startX + i * 20;
      const circleY = yPos - 2;

      // Draw circle
      doc
        .circle(circleX, circleY + 5, 8)
        .fillAndStroke(
          i <= rating ? this.COLORS.primary : "#ffffff",
          this.COLORS.border,
        );

      if (i <= rating) {
        doc
          .fontSize(12)
          .fillColor("white")
          .text(i.toString(), circleX - 3, circleY + 1);
      } else {
        doc
          .fontSize(12)
          .fillColor(this.COLORS.text)
          .text(i.toString(), circleX - 3, circleY + 1);
      }
    }

    return yPos + 25;
  }

  private static drawSignatureSection(
    doc: PDFKit.PDFDocument,
    data: DeliveryFormPODData,
    yPos: number,
  ): number {
    const margin = 20;
    const pageWidth = doc.page.width;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(
        "I confirm that the above details are correct and the vehicle has been delivered in the condition described:",
        margin,
        yPos,
      );

    yPos += 20;

    // Two-column signature layout
    const colWidth = (pageWidth - 2 * margin) / 2;
    const leftCol = margin;
    const rightCol = margin + colWidth + 15;

    // Customer signature
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Customer Signature", leftCol, yPos);

    // Signature line
    doc
      .moveTo(leftCol, yPos + 20)
      .lineTo(leftCol + 120, yPos + 20)
      .stroke(this.COLORS.border);

    if (data.customerSignature && data.customerSignature !== "N/A") {
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .text("Signature on file", leftCol, yPos + 25);
    }

    const currentDate = new Date();
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(`Name: ${data.customerName}`, leftCol, yPos + 35)
      .text(
        `Date: ${currentDate.toLocaleDateString("en-GB")}`,
        leftCol,
        yPos + 48,
      )
      .text(
        `Time: ${currentDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
        leftCol,
        yPos + 61,
      );

    // Driver signature
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Driver Signature", rightCol, yPos);

    // Signature line
    doc
      .moveTo(rightCol, yPos + 20)
      .lineTo(rightCol + 120, yPos + 20)
      .stroke(this.COLORS.border);

    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Driver/Company Representative", rightCol, yPos + 25)
      .text(
        `Name: ${data.job.driver?.name || "OVM Representative"}`,
        rightCol,
        yPos + 35,
      )
      .text(
        `Date: ${currentDate.toLocaleDateString("en-GB")}`,
        rightCol,
        yPos + 48,
      )
      .text(
        `Time: ${currentDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
        rightCol,
        yPos + 61,
      );

    return yPos + 85;
  }

  private static drawFooter(doc: PDFKit.PDFDocument) {
    const margin = 20;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 30;

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666")
      .text(
        `© 2025 ${this.COMPANY_INFO.name} • Company Number: ${this.COMPANY_INFO.companyNumber} • Email: ${this.COMPANY_INFO.email} • Phone: ${this.COMPANY_INFO.phone}`,
        margin,
        footerY,
        { width: pageWidth - 2 * margin, align: "center" },
      );
  }

  private static drawCheckbox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    checked: boolean,
  ) {
    const size = 8;

    // Draw checkbox border
    doc.rect(x, y, size, size).fillAndStroke("#ffffff", this.COLORS.border);

    // Draw checkmark if checked
    if (checked) {
      doc.strokeColor(this.COLORS.primary).lineWidth(1.5);

      // Professional checkmark
      doc
        .moveTo(x + 1.5, y + 4)
        .lineTo(x + 3, y + 5.5)
        .lineTo(x + 6.5, y + 2)
        .stroke();
    }
  }
}
