import { apiRequest } from "@/lib/queryClient";

export interface MileageCalculation {
  mileage: number;
  fromPostcode: string;
  toPostcode: string;
  route?: {
    distance: number;
    duration: number;
    coordinates?: Array<[number, number]>;
  };
}

export const mileageService = {
  async calculateMileage(fromPostcode: string, toPostcode: string): Promise<MileageCalculation> {
    const response = await apiRequest("POST", "/api/mileage/calculate", {
      fromPostcode,
      toPostcode,
    });
    return response.json();
  },

  async getOptimizedRoute(waypoints: string[]): Promise<{
    optimizedOrder: string[];
    totalMileage: number;
    segments: Array<{
      from: string;
      to: string;
      mileage: number;
    }>;
  }> {
    const response = await apiRequest("POST", "/api/mileage/optimize-route", {
      waypoints,
    });
    return response.json();
  },

  /**
   * Calculate pricing based on mileage and rate
   */
  calculatePricing(mileage: number, ratePerMile: number): {
    subtotal: number;
    vat: number;
    total: number;
  } {
    const subtotal = mileage * ratePerMile;
    const vat = subtotal * 0.2; // 20% VAT
    const total = subtotal + vat;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  },

  /**
   * Validate UK postcode format
   */
  validatePostcode(postcode: string): boolean {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  },

  /**
   * Format postcode to standard UK format
   */
  formatPostcode(postcode: string): string {
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
    }
    return cleaned;
  }
};
