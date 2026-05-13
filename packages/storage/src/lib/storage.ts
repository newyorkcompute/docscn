import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export interface ArtifactObjectRef {
  key: string;
  bucket: string;
}

export interface ArtifactStorage {
  getHtml(key: string): Promise<string>;
  putHtml(input: {
    artifactId: string;
    revisionId: string;
    html: string;
  }): Promise<ArtifactObjectRef>;
}

interface S3StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function getS3StorageConfig(): S3StorageConfig | undefined {
  const endpoint = process.env['S3_ENDPOINT'];
  const region = process.env['S3_REGION'];
  const bucket = process.env['S3_BUCKET'];
  const accessKeyId = process.env['S3_ACCESS_KEY_ID'];
  const secretAccessKey = process.env['S3_SECRET_ACCESS_KEY'];

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    return undefined;
  }

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
  };
}

function createS3Client(config: S3StorageConfig) {
  return new S3Client({
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

let storageClient: ArtifactStorage | null = null;

export function isObjectStorageConfigured() {
  return Boolean(getS3StorageConfig());
}

export function getArtifactStorage(): ArtifactStorage | undefined {
  const config = getS3StorageConfig();

  if (!config) {
    return undefined;
  }

  if (!storageClient) {
    const s3 = createS3Client(config);

    storageClient = {
      async getHtml(key: string) {
        const response = await s3.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );

        if (!response.Body) {
          return '';
        }

        return response.Body.transformToString();
      },
      async putHtml({ artifactId, revisionId, html }) {
        const key = `artifacts/${artifactId}/revisions/${revisionId}.html`;

        await s3.send(
          new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Body: html,
            ContentType: 'text/html; charset=utf-8',
          }),
        );

        return {
          key,
          bucket: config.bucket,
        };
      },
    };
  }

  return storageClient;
}
