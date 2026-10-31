/**
 * 📊 ANALYTICS DATABASE - VISITANTES ÚNICOS POR DEVICE-ID
 * Tracks unique visitors by device-id and clicks for daily analytics
 * Uses API endpoint instead of direct Firestore writes (more secure)
 */

import { db } from "./firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { getOrCreateDeviceId } from "./device-id-client";

const ANALYTICS_COLLECTION = "analytics";
const API_TRACK_URL = "/api/analytics/track";

interface DailyAnalytics {
  date: string; // YYYY-MM-DD format
  uniqueVisitors: number;
  visitorIds: string[]; // Array de device-ids únicos
  totalClicks: number;
  clicksByType: {
    productClick: number;
    categoryClick: number;
    buttonClick: number;
    linkClick: number;
    blogClick: number;
    [key: string]: number;
  };
  purchases: {
    whatsapp: number;
    transferencia: number;
    total: number;
  };
  lastUpdated: any;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Track a page view by device-id (counts unique visitors)
 * Uses API endpoint for safety and permissions
 */
export async function trackPageView(): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    console.log("[Analytics] Tracking page view for device:", deviceId);

    const response = await fetch(API_TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "pageView",
        deviceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Analytics] API returned non-ok status:", response.status);
      console.error("[Analytics] API response:", errorText);
    } else {
      console.log("[Analytics] Page view tracked successfully");
    }
  } catch (error) {
    console.error("[Analytics] Error tracking page view:", error);
  }
}

/**
 * Track a click event
 * Uses API endpoint for safety and permissions
 */
export async function trackClick(
  type: "productClick" | "categoryClick" | "buttonClick" | "linkClick" | "blogClick" = "buttonClick"
): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    console.log("[Analytics] Tracking click:", { type, deviceId });

    const response = await fetch(API_TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "click",
        clickType: type,
        deviceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Analytics] Click API returned non-ok status:", response.status);
      console.error("[Analytics] Click API response:", errorText);
    } else {
      console.log("[Analytics] Click tracked successfully");
    }
  } catch (error) {
    console.error("[Analytics] Error tracking click:", error);
  }
}

/**
 * Get today's analytics
 */
export async function getTodayAnalytics(): Promise<DailyAnalytics | null> {
  try {
    const today = getTodayDate();
    const docRef = doc(db, ANALYTICS_COLLECTION, today);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DailyAnalytics;
      // Ensure purchases field exists with defaults
      if (!data.purchases) {
        data.purchases = {
          whatsapp: 0,
          transferencia: 0,
          total: 0,
        };
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error("[Analytics] Error getting today's analytics:", error);
    return null;
  }
}

/**
 * Reset today's analytics (DO NOT USE - only for development)
 * The API endpoint handles daily resets via cron job
 */
export async function resetTodayAnalytics(): Promise<void> {
  console.warn("[Analytics] resetTodayAnalytics is deprecated - use /api/admin/reset-analytics instead");
}

/**
 * Get analytics for a specific date
 */
export async function getAnalyticsByDate(date: string): Promise<DailyAnalytics | null> {
  try {
    const docRef = doc(db, ANALYTICS_COLLECTION, date);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DailyAnalytics;
      // Ensure purchases field exists with defaults
      if (!data.purchases) {
        data.purchases = {
          whatsapp: 0,
          transferencia: 0,
          total: 0,
        };
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error("[Analytics] Error getting analytics for date:", date, error);
    return null;
  }
}

/**
 * Track a purchase event (client-side)
 * Uses API endpoint for safety and permissions
 */
export async function trackPurchase(
  metodoPago: "whatsapp" | "transferencia"
): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    console.log("[Analytics] Tracking purchase:", { metodoPago, deviceId });

    const response = await fetch(API_TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "purchase",
        purchaseType: metodoPago,
        deviceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Analytics] Purchase API returned non-ok status:", response.status);
      console.error("[Analytics] Purchase API response:", errorText);
    } else {
      console.log("[Analytics] Purchase tracked successfully");
    }
  } catch (error) {
    console.error("[Analytics] Error tracking purchase:", error);
  }
}

/**
 * Get weekly analytics (last 7 days)
 */
export async function getWeeklyAnalytics(): Promise<DailyAnalytics[]> {
  try {
    const analytics: DailyAnalytics[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const data = await getAnalyticsByDate(dateStr);
      if (data) {
        analytics.push(data);
      } else {
        // Add empty analytics for missing days
        analytics.push({
          date: dateStr,
          uniqueVisitors: 0,
          visitorIds: [],
          totalClicks: 0,
          clicksByType: {
            productClick: 0,
            categoryClick: 0,
            buttonClick: 0,
            linkClick: 0,
            blogClick: 0,
          },
          purchases: {
            whatsapp: 0,
            transferencia: 0,
            total: 0,
          },
          lastUpdated: null,
        });
      }
    }

    return analytics;
  } catch (error) {
    console.error("[Analytics] Error getting weekly analytics:", error);
    return [];
  }
}
