import { CompanyProfile, FileAsset } from '../../generated/prisma';

export function serializeCompanyProfile(
  profile: CompanyProfile | null,
  assets: FileAsset[],
) {
  return {
    intro: profile?.intro || '',
    main_products: profile?.mainProducts || '',
    display_address: profile?.displayAddress || '',
    display_phone: profile?.displayPhone || '',
    qualification_description: profile?.qualificationDescription || '',
    is_public_enabled: Boolean(profile?.isPublicEnabled),
    assets: assets.map(serializeFileAsset),
  };
}

export function serializeFileAsset(asset: FileAsset) {
  return {
    id: asset.id.toString(),
    company_id: asset.companyId?.toString() || null,
    biz_type: asset.bizType,
    file_type: asset.fileType,
    file_name: asset.fileName,
    file_url: asset.fileUrl,
    mime_type: asset.mimeType,
    file_size: asset.fileSize?.toString() || null,
    storage_driver: asset.storageDriver,
    is_public: asset.isPublic,
    sort_order: asset.sortOrder,
    uploaded_at: asset.uploadedAt,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}
