import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function saveUpload(file: File, folder: string) {
  if (!file || file.size === 0) return null;
  const safe = file.name.replace(/[^\w.\-() ]+/g, "_");
  const filename = `${Date.now()}-${safe}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${folder}/${filename}`, buf, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/${folder}/${filename}`;
}
