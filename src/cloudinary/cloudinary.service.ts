import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

export interface CloudinaryResponse {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  resourceType: string;
  width?: number;
  height?: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadFile(
    file: Express.Multer.File,
    folder = 'task-management/attachments',
  ): Promise<CloudinaryResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file buffer');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          filename_override: file.originalname,
          use_filename: true,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(
              `Cloudinary upload error: ${error.message}`,
              error,
            );
            return reject(
              new InternalServerErrorException(
                `Failed to upload file to Cloudinary: ${error.message}`,
              ),
            );
          }

          if (!result) {
            return reject(
              new InternalServerErrorException(
                'Cloudinary upload returned no result',
              ),
            );
          }

          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format || file.mimetype.split('/')[1] || '',
            bytes: result.bytes || file.size,
            resourceType: result.resource_type,
            width: result.width,
            height: result.height,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'task-management/avatars',
  ): Promise<CloudinaryResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file buffer');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(
              `Cloudinary avatar upload error: ${error.message}`,
              error,
            );
            return reject(
              new InternalServerErrorException(
                `Failed to upload image to Cloudinary: ${error.message}`,
              ),
            );
          }

          if (!result) {
            return reject(
              new InternalServerErrorException(
                'Cloudinary upload returned no result',
              ),
            );
          }

          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            resourceType: result.resource_type,
            width: result.width,
            height: result.height,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(
    publicId: string,
    resourceType = 'image',
  ): Promise<{ result: string }> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })) as { result: string };
      return result;
    } catch (error) {
      this.logger.warn(
        `Failed to delete Cloudinary file ${publicId}: ${String(error)}`,
      );
      return { result: 'failed' };
    }
  }

  getOptimizedUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string } = {},
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      quality: 'auto',
      fetch_format: 'auto',
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
    });
  }
}
