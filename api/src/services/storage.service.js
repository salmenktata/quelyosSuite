const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const logger = require("../../logger");
const crypto = require("crypto");
const NodeClam = require("clamscan");

/**
 * Service de stockage S3/MinIO pour documents RH
 *
 * Fonctionnalités:
 * - Upload de fichiers avec chiffrement
 * - Génération d'URLs signées (1h expiry)
 * - Suppression de fichiers
 * - Scan antivirus avec ClamAV
 * - Isolation multi-tenant par companyId
 *
 * Structure des buckets:
 * - rh-documents/{companyId}/contracts/
 * - rh-documents/{companyId}/justifications/
 * - rh-documents/{companyId}/paystubs/
 * - rh-photos/{companyId}/profiles/
 */
class StorageService {
  constructor() {
    // Configuration S3/MinIO
    this.endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
    this.region = process.env.S3_REGION || "us-east-1";
    this.accessKeyId = process.env.S3_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.documentsBucket = process.env.S3_DOCUMENTS_BUCKET || "rh-documents";
    this.photosBucket = process.env.S3_PHOTOS_BUCKET || "rh-photos";
    this.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

    // Initialiser le client S3
    if (this.accessKeyId && this.secretAccessKey) {
      this.s3Client = new S3Client({
        endpoint: this.endpoint,
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
        forcePathStyle: this.forcePathStyle, // Nécessaire pour MinIO
      });

      logger.info("[StorageService] S3 client initialized", {
        endpoint: this.endpoint,
        region: this.region,
        forcePathStyle: this.forcePathStyle,
      });
    } else {
      logger.warn(
        "[StorageService] S3 credentials not configured - storage disabled"
      );
      this.s3Client = null;
    }

    // Initialiser ClamAV pour scan antivirus
    this.clamScan = null;
    this.initClamAV();
  }

  /**
   * Initialiser ClamAV pour scan antivirus
   */
  async initClamAV() {
    try {
      const clamavHost = process.env.CLAMAV_HOST || "localhost";
      const clamavPort = process.env.CLAMAV_PORT || 3310;

      this.clamScan = await new NodeClam().init({
        clamdscan: {
          host: clamavHost,
          port: clamavPort,
        },
        preference: "clamdscan",
      });

      logger.info("[StorageService] ClamAV initialized", {
        host: clamavHost,
        port: clamavPort,
      });
    } catch (error) {
      logger.warn("[StorageService] ClamAV not available - skipping virus scan", {
        error: error.message,
      });
      this.clamScan = null;
    }
  }

  /**
   * Scanner un fichier avec ClamAV
   * @param {Buffer} buffer - Contenu du fichier
   * @param {string} filename - Nom du fichier
   * @returns {Promise<{isInfected: boolean, viruses: string[]}>}
   */
  async scanFile(buffer, filename) {
    if (!this.clamScan) {
      logger.warn("[StorageService] ClamAV not available - skipping scan");
      return { isInfected: false, viruses: [] };
    }

    try {
      // ClamAV scan du buffer
      const { isInfected, viruses } = await this.clamScan.scanStream(buffer);

      if (isInfected) {
        logger.error("[StorageService] Virus detected in file", {
          filename,
          viruses,
        });
      }

      return { isInfected, viruses };
    } catch (error) {
      logger.error("[StorageService] ClamAV scan failed", {
        filename,
        error: error.message,
      });
      // En cas d'erreur de scan, on bloque par sécurité
      return { isInfected: true, viruses: ["SCAN_ERROR"] };
    }
  }

  /**
   * Upload un fichier vers S3/MinIO
   * @param {Object} options
   * @param {Buffer} options.buffer - Contenu du fichier
   * @param {string} options.filename - Nom du fichier
   * @param {string} options.mimetype - Type MIME
   * @param {number} options.companyId - ID de l'entreprise (isolation)
   * @param {string} options.folder - Dossier (contracts, justifications, paystubs, profiles)
   * @param {string} options.bucket - Bucket (documents ou photos)
   * @param {Object} options.metadata - Métadonnées additionnelles
   * @returns {Promise<{success: boolean, key?: string, url?: string, error?: string}>}
   */
  async uploadFile({
    buffer,
    filename,
    mimetype,
    companyId,
    folder = "documents",
    bucket = "documents",
    metadata = {},
  }) {
    if (!this.s3Client) {
      return {
        success: false,
        error: "Storage service not configured",
      };
    }

    try {
      // 1. Scan antivirus
      const scanResult = await this.scanFile(buffer, filename);
      if (scanResult.isInfected) {
        logger.error("[StorageService] File rejected - virus detected", {
          filename,
          viruses: scanResult.viruses,
        });
        return {
          success: false,
          error: `Virus detected: ${scanResult.viruses.join(", ")}`,
        };
      }

      // 2. Générer une clé unique avec chemin isolé par company
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(8).toString("hex");
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `${companyId}/${folder}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;

      // 3. Sélectionner le bucket approprié
      const bucketName =
        bucket === "photos" ? this.photosBucket : this.documentsBucket;

      // 4. Préparer les métadonnées
      const s3Metadata = {
        companyId: String(companyId),
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      };

      // 5. Upload vers S3/MinIO avec chiffrement
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        Metadata: s3Metadata,
        ServerSideEncryption: "AES256", // Chiffrement côté serveur
      });

      await this.s3Client.send(command);

      logger.info("[StorageService] File uploaded successfully", {
        key,
        bucket: bucketName,
        size: buffer.length,
        companyId,
      });

      return {
        success: true,
        key,
        bucket: bucketName,
        url: `${this.endpoint}/${bucketName}/${key}`,
      };
    } catch (error) {
      logger.error("[StorageService] Upload failed", {
        filename,
        companyId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message || "Upload failed",
      };
    }
  }

  /**
   * Générer une URL signée pour téléchargement sécurisé
   * @param {string} key - Clé du fichier dans S3
   * @param {string} bucket - Bucket (documents ou photos)
   * @param {number} expiresIn - Expiration en secondes (défaut: 1h)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getSignedDownloadUrl(key, bucket = "documents", expiresIn = 3600) {
    if (!this.s3Client) {
      return {
        success: false,
        error: "Storage service not configured",
      };
    }

    try {
      const bucketName =
        bucket === "photos" ? this.photosBucket : this.documentsBucket;

      // Vérifier que le fichier existe
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(headCommand);

      // Générer URL signée avec expiration
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn,
      });

      logger.info("[StorageService] Signed URL generated", {
        key,
        bucket: bucketName,
        expiresIn,
      });

      return {
        success: true,
        url: signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    } catch (error) {
      logger.error("[StorageService] Failed to generate signed URL", {
        key,
        bucket,
        error: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to generate download URL",
      };
    }
  }

  /**
   * Supprimer un fichier de S3/MinIO
   * @param {string} key - Clé du fichier
   * @param {string} bucket - Bucket (documents ou photos)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteFile(key, bucket = "documents") {
    if (!this.s3Client) {
      return {
        success: false,
        error: "Storage service not configured",
      };
    }

    try {
      const bucketName =
        bucket === "photos" ? this.photosBucket : this.documentsBucket;

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info("[StorageService] File deleted successfully", {
        key,
        bucket: bucketName,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error("[StorageService] Delete failed", {
        key,
        bucket,
        error: error.message,
      });
      return {
        success: false,
        error: error.message || "Delete failed",
      };
    }
  }

  /**
   * Vérifier si un fichier existe
   * @param {string} key - Clé du fichier
   * @param {string} bucket - Bucket (documents ou photos)
   * @returns {Promise<{exists: boolean, metadata?: Object}>}
   */
  async fileExists(key, bucket = "documents") {
    if (!this.s3Client) {
      return { exists: false };
    }

    try {
      const bucketName =
        bucket === "photos" ? this.photosBucket : this.documentsBucket;

      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        exists: true,
        metadata: response.Metadata,
        size: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error) {
      if (error.name === "NotFound") {
        return { exists: false };
      }

      logger.error("[StorageService] Failed to check file existence", {
        key,
        bucket,
        error: error.message,
      });
      return { exists: false };
    }
  }

  /**
   * Valider les permissions d'accès à un fichier
   * @param {string} key - Clé du fichier
   * @param {number} companyId - ID de l'entreprise demandant l'accès
   * @returns {boolean} - true si l'accès est autorisé
   */
  validateFileAccess(key, companyId) {
    // Extraction du companyId depuis la clé (format: {companyId}/folder/file)
    const keyCompanyId = key.split("/")[0];

    if (keyCompanyId !== String(companyId)) {
      logger.warn("[StorageService] Access denied - company mismatch", {
        key,
        requestedBy: companyId,
        fileOwner: keyCompanyId,
      });
      return false;
    }

    return true;
  }
}

// Singleton
const storageService = new StorageService();

module.exports = storageService;
