import { Timestamp } from "firebase/firestore";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { firestore as db, auth } from "../firebase/firebase";
import {
  QRCodeInput,
  QRCodeStats,
  convertToQRCode,
  convertToCampaign,
} from "../services/types";
import {
  safeConvertToDate,
  safeConvertToISOString,
} from "../utils/timestampUtils";

export interface QRCode {
  id: string;
  data: string;
  userId: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  scans: number;
  lastScan?: Timestamp | Date | null;
  campaign?: string | null;
  image_url?: string;
  intensity?: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  qrCount: number;
  totalScans: number;
}

class QRCodeService {
  private qrCodesCollection = collection(db, "qrCodes");
  private scansCollection = collection(db, "scans");
  private campaignsCollection = collection(db, "campaigns");

  async createQRCode(qrCodeData: QRCodeInput): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create QR codes");
      }

      const qrCodeToSave = {
        ...qrCodeData,
        userId: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        scans: 0,
        lastScan: qrCodeData.lastScan
          ? safeConvertToDate(qrCodeData.lastScan)
          : null,
      };

      const docRef = await addDoc(this.qrCodesCollection, qrCodeToSave);

      if (qrCodeData.campaign) {
        await this.incrementCampaignQRCount(qrCodeData.campaign);
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating QR code:", error);
      throw error;
    }
  }

  async getUserQRCodes(): Promise<QRCode[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to fetch QR codes");
      }

      const q = query(
        this.qrCodesCollection,
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return convertToQRCode({
          qr_id: doc.id,
          type: "dynamic",
          contentType: "url",
          userId: "unknown",
          campaign: "uncategorized",
          ...data,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          imageUrl: data.imageUrl || "",
          data: data.data || "",
          intensity: data.intensity || 0,
        });
      });
    } catch (error) {
      console.error("Error fetching user QR codes:", error);
      throw error;
    }
  }

  async getQRCode(id: string): Promise<QRCode> {
    try {
      const docRef = doc(this.qrCodesCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn("⚠️ Document not found, returning default QR code.");
        return {
          id: "not-found",
          data: "",
          userId: "unknown",
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          scans: 0,
        };
      }

      const data = docSnap.data();

      return convertToQRCode({
        qr_id: docSnap.id,
        type: data.type || "dynamic",
        contentType: data.contentType || "url",
        userId: data.userId || "unknown",
        campaign: data.campaign || "",
        ...data,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        imageUrl: data.imageUrl || "",
        data: data.data || "",
        intensity: data.intensity || 0,
      });
    } catch (error) {
      console.error("Error fetching QR code:", error);
      return {
        id: "error",
        userId: "",
        data: "Error retrieving QR code",
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        scans: 0,
      };
    }
  }

  async updateQRCode(id: string, updates: Partial<QRCodeInput>): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to update QR codes");
      }

      const qrCode = await this.getQRCode(id);
      if (!qrCode || qrCode.userId !== currentUser.uid) {
        throw new Error("You do not have permission to update this QR code");
      }

      if (
        updates.campaign !== undefined &&
        updates.campaign !== qrCode.campaign
      ) {
        if (qrCode.campaign) {
          await this.decrementCampaignQRCount(qrCode.campaign);
        }

        if (updates.campaign) {
          await this.incrementCampaignQRCount(updates.campaign);
        }
      }

      const docRef = doc(this.qrCodesCollection, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating QR code:", error);
      throw error;
    }
  }

  async deleteQRCode(id: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to delete QR codes");
      }

      const qrCode = await this.getQRCode(id);
      if (!qrCode || qrCode.userId !== currentUser.uid) {
        throw new Error("You do not have permission to delete this QR code");
      }

      if (qrCode.campaign) {
        await this.decrementCampaignQRCount(qrCode.campaign);
      }

      await deleteDoc(doc(this.qrCodesCollection, id));
    } catch (error) {
      console.error("Error deleting QR code:", error);
      throw error;
    }
  }

  async recordScan(
    qrCodeId: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      const qrCode = await this.getQRCode(qrCodeId);
      if (!qrCode) {
        throw new Error("QR code not found");
      }

      await addDoc(this.scansCollection, {
        qrCodeId,
        timestamp: Timestamp.fromDate(new Date()),
        ...metadata,
      });

      const docRef = doc(this.qrCodesCollection, qrCodeId);
      await updateDoc(docRef, {
        scans: (qrCode.scans || 0) + 1,
        lastScan: Timestamp.fromDate(new Date()),
      });

      if (qrCode.campaign) {
        await this.incrementCampaignScanCount(qrCode.campaign);
      }
    } catch (error) {
      console.error("Error recording scan:", error);
      throw error;
    }
  }

  async getQRCodeStats(
    qrCodeId: string,
    days: number = 30,
  ): Promise<QRCodeStats> {
    try {
      const qrCode = await this.getQRCode(qrCodeId);
      if (!qrCode) {
        throw new Error("QR code not found");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startTimestamp = Timestamp.fromDate(startDate);

      const q = query(
        this.scansCollection,
        where("qrCodeId", "==", qrCodeId),
        where("timestamp", ">=", startTimestamp),
        orderBy("timestamp", "asc"),
      );

      const querySnapshot = await getDocs(q);
      const scans = querySnapshot.docs.map((doc) => doc.data());

      const scansByDay: Record<string, number> = {};

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        scansByDay[dateString] = 0;
      }

      scans.forEach((scan) => {
        const scanDate = (scan.timestamp as Timestamp).toDate();
        const dateString = scanDate.toISOString().split("T")[0];
        scansByDay[dateString] = (scansByDay[dateString] || 0) + 1;
      });

      const chartData = Object.entries(scansByDay)
        .map(([date, count]) => ({ date, scans: count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalScans: qrCode.scans || 0,
        lastScan: qrCode.lastScan
          ? safeConvertToISOString(qrCode.lastScan)
          : null,
        dailyScans: chartData,
      };
    } catch (error) {
      console.error("Error getting QR code stats:", error);
      throw error;
    }
  }

  async createCampaign(
    name: string,
    description: string = "",
  ): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create campaigns");
      }

      const campaign = {
        name,
        description,
        userId: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        qrCount: 0,
        totalScans: 0,
      };

      const docRef = await addDoc(this.campaignsCollection, campaign);
      return docRef.id;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }

  async getUserCampaigns(): Promise<Campaign[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to fetch campaigns");
      }

      const q = query(
        this.campaignsCollection,
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return convertToCampaign({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(),
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : new Date(),
        });
      });
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      throw error;
    }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    try {
      const docRef = doc(this.campaignsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return convertToCampaign({
        id: docSnap.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : new Date(),
      });
    } catch (error) {
      console.error("Error fetching campaign:", error);
      throw error;
    }
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to update campaigns");
      }

      const docRef = doc(this.campaignsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Campaign not found");
      }

      const campaign = docSnap.data();
      if (campaign.userId !== currentUser.uid) {
        throw new Error("You do not have permission to update this campaign");
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating campaign:", error);
      throw error;
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to delete campaigns");
      }

      const docRef = doc(this.campaignsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Campaign not found");
      }

      const campaign = docSnap.data();
      if (campaign.userId !== currentUser.uid) {
        throw new Error("You do not have permission to delete this campaign");
      }

      const qrCodesQuery = query(
        this.qrCodesCollection,
        where("userId", "==", currentUser.uid),
        where("campaign", "==", id),
      );

      const qrCodesSnapshot = await getDocs(qrCodesQuery);

      const updatePromises = qrCodesSnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { campaign: null }),
      );

      await Promise.all(updatePromises);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      throw error;
    }
  }

  private async incrementCampaignQRCount(campaignId: string): Promise<void> {
    const campaignRef = doc(this.campaignsCollection, campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (campaignSnap.exists()) {
      const campaign = campaignSnap.data();
      await updateDoc(campaignRef, {
        qrCount: (campaign.qrCount || 0) + 1,
      });
    }
  }

  private async decrementCampaignQRCount(campaignId: string): Promise<void> {
    const campaignRef = doc(this.campaignsCollection, campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (campaignSnap.exists()) {
      const campaign = campaignSnap.data();
      await updateDoc(campaignRef, {
        qrCount: Math.max((campaign.qrCount || 0) - 1, 0),
      });
    }
  }

  private async incrementCampaignScanCount(campaignId: string): Promise<void> {
    const campaignRef = doc(this.campaignsCollection, campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (campaignSnap.exists()) {
      const campaign = campaignSnap.data();
      await updateDoc(campaignRef, {
        totalScans: (campaign.totalScans || 0) + 1,
      });
    }
  }
}

export const qrCodeService = new QRCodeService();
export default qrCodeService;
