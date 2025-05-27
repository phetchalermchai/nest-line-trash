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
}
