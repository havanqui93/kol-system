import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider, UploadOptions } from "../types.js";

export class R2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(config?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    publicBaseUrl?: string;
  }) {
    const accountId = config?.accountId ?? process.env.R2_ACCOUNT_ID ?? "";
    this.bucket = config?.bucket ?? process.env.S3_BUCKET ?? "kol-assets";
    this.publicBaseUrl = config?.publicBaseUrl ?? process.env.R2_PUBLIC_URL ?? "";

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config?.accessKeyId ?? process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: config?.secretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async upload(key: string, data: Buffer | Blob, options?: UploadOptions): Promise<string> {
    const body = data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : data;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType ?? "application/octet-stream",
      })
    );
    return this.publicBaseUrl ? `${this.publicBaseUrl}/${key}` : key;
  }

  async uploadFromUrl(key: string, sourceUrl: string): Promise<string> {
    const response = await fetch(sourceUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? undefined;
    return this.upload(key, buffer, { contentType });
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}
