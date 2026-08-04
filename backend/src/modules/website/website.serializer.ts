import { FileAsset } from '../../generated/prisma';

export function serializeWebsiteMaterial(asset: FileAsset) {
  return {
    id: asset.id.toString(),
    title: asset.title || asset.fileName,
    category: asset.category || asset.fileType,
    description: asset.description || '',
    file_name: asset.fileName,
    file_type: asset.fileType,
    file_url: asset.fileUrl,
    mime_type: asset.mimeType,
    file_size: asset.fileSize?.toString() || null,
    is_public: asset.isPublic,
    is_recommended: asset.isRecommended,
    sort_order: asset.sortOrder,
    uploaded_at: asset.uploadedAt,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}
