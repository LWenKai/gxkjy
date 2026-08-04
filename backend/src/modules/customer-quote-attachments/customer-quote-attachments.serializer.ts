import { CustomerQuoteAttachment } from '../../generated/prisma';

export function serializeQuoteAttachment(attachment: CustomerQuoteAttachment) {
  return {
    id: attachment.id.toString(),
    quote_id: attachment.quoteId.toString(),
    original_name: attachment.originalName,
    stored_name: attachment.storedName,
    mime_type: attachment.mimeType,
    file_extension: attachment.fileExtension,
    file_size: attachment.fileSize.toString(),
    created_at: attachment.createdAt,
  };
}
