import { AiInterpretationJob } from '../../generated/prisma';

export function serializeAiInterpretationJob(
  job: AiInterpretationJob & {
    detectionRecord?: { id: bigint; recordNo: string; overallResult: string } | null;
  },
) {
  return {
    id: job.id.toString(),
    test_item: job.testItem,
    product_name: job.productName,
    sample_name: job.sampleName,
    result: job.aiResult,
    confidence: job.confidence === null ? null : Number(job.confidence),
    reason: job.reason,
    status: job.status,
    error_reason: job.errorReason,
    error_message: (job as { errorMessage?: string | null }).errorMessage,
    quality: (job as { imageQuality?: string | null }).imageQuality,
    quality_message: (job as { imageQualityMessage?: string | null }).imageQualityMessage,
    retry_count: (job as { retryCount?: number }).retryCount ?? 0,
    confirmed_result: job.confirmedResult,
    confirmed_at: job.confirmedAt,
    detection_record: job.detectionRecord
      ? {
          id: job.detectionRecord.id.toString(),
          record_no: job.detectionRecord.recordNo,
          overall_result:
            job.detectionRecord.overallResult === 'pass'
              ? 'qualified'
              : 'unqualified',
        }
      : null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}
