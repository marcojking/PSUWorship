import Dexie, { type EntityTable } from "dexie";

export interface MerchDraft {
  id?: number;
  designConfigs: { designId: string; size: string; position: string }[];
  clothingItemId?: string;
  uploadedClothingBlob?: Blob;
  mockupBlob?: Blob;
  closeupBlobs?: Blob[];
  name?: string;
  totalPrice: number; // cents
  createdAt: Date;
}

class MerchDraftsDB extends Dexie {
  merchDrafts!: EntityTable<MerchDraft, "id">;

  constructor() {
    super("MerchDraftsDB");
    this.version(1).stores({
      merchDrafts: "++id, createdAt",
    });
  }
}

const db = new MerchDraftsDB();

export async function saveDraft(draft: Omit<MerchDraft, "id" | "createdAt">): Promise<number> {
  const id = await db.merchDrafts.add({
    ...draft,
    createdAt: new Date(),
  });
  return id as number;
}

export async function getAllDrafts(): Promise<MerchDraft[]> {
  return await db.merchDrafts.orderBy("createdAt").reverse().toArray();
}

export async function getDraft(id: number): Promise<MerchDraft | undefined> {
  return await db.merchDrafts.get(id);
}

export async function deleteDraft(id: number): Promise<void> {
  await db.merchDrafts.delete(id);
}

export async function updateDraftName(id: number, name: string): Promise<void> {
  await db.merchDrafts.update(id, { name });
}
