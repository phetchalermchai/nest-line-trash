import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  async uploadImage(fileBuffer: Buffer, filename: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(filename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${filename}`;
  }

  async deleteImage(publicUrl: string): Promise<void> {
    try {
      const base = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/`;

      if (!publicUrl.startsWith(base)) {
        console.warn("Invalid public URL. Skip deleting:", publicUrl);
        return;
      }

      const path = publicUrl.replace(base, "").split("?")[0]; // remove query string if present

      const { error } = await this.supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .remove([path]);

      if (error) {
        console.error("Error deleting image from Supabase:", error.message);
        throw error;
      }
    } catch (err) {
      console.error("deleteImage failed:", err);
      throw err;
    }
  }

}
