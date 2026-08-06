<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  getClientDetectionRecord,
  getClientCompany,
} from '@/api/client';
import { formatDateTime } from '@/utils/time';
import type { DetectionRecord, DetectionRecordItem, ClientCompany } from '@/types/api';

const route = useRoute();
const router = useRouter();

const recordId = (route.params.id as string) || '';
const loading = ref(true);
const record = ref<DetectionRecord | null>(null);
const company = ref<ClientCompany | null>(null);

const report = ref({
  reportNo: '',
  testBasis: 'GB/T 5009.199 蔬菜中有机磷和氨基甲酸酯类农药残留量的快速检测',
  sampleQuantity: '',
  origin: '',
  tester: '',
  reviewer: '',
  issueDate: new Date().toISOString().slice(0, 10),
});

const qrcodeToken = ref('');
const qrcodeUrl = computed(() => {
  if (qrcodeToken.value) return `https://api.gxkjy.com/c/?token=${qrcodeToken.value}`;
  return '';
});

const companyName = computed(() => company.value?.name || record.value?.company_name || '—');
const contactName = computed(() => company.value?.contact_name || '—');
const contactPhone = computed(() => company.value?.phone || '—');
const companyAddress = computed(() => company.value?.address || company.value?.origin_address || '—');

const overallPass = computed(() => record.value?.overall_result === 'qualified');

const hasCertificate = computed(
  () => !!record.value?.certificates && record.value!.certificates!.length > 0,
);

function resultText(r: DetectionRecordItem['result']) {
  return r === 'qualified' ? '合格' : r === 'unqualified' ? '不合格' : r || '—';
}

function back() {
  router.push('/client/detection-records');
}

function doPrint() {
  window.print();
}

const downloading = ref(false);

async function downloadPdf() {
  const sheet = document.getElementById('report-sheet');
  if (!sheet) return;
  downloading.value = true;
  try {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`检测报告_${report.value.reportNo || 'export'}.pdf`);
  } finally {
    downloading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const rec = await getClientDetectionRecord(recordId);
    record.value = rec;
    if (rec.company_id) {
      try {
        company.value = await getClientCompany();
      } catch {
        company.value = null;
      }
    }
    const certSummary = rec.certificates?.[0];
    if (certSummary?.public_token) {
      qrcodeToken.value = certSummary.public_token;
    }
    if (!report.value.reportNo) {
      report.value.reportNo = `GX-JC-${rec.record_no}`;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="report-page" v-loading="loading">
    <div class="report-toolbar no-print">
      <el-button @click="back">返回</el-button>
      <el-button type="primary" plain @click="doPrint">打印</el-button>
      <el-button type="primary" :loading="downloading" @click="downloadPdf">下载 PDF</el-button>
    </div>

    <div class="report-sheet" id="report-sheet">
      <div class="report-header">
        <div class="rh-side rh-spacer"></div>
        <div class="rh-center">
          <div class="rh-title">农产品农药残留快速检测报告</div>
          <div class="rh-no">报告编号：{{ report.reportNo || '—' }}</div>
        </div>
        <div class="rh-side rh-right" v-if="hasCertificate && qrcodeUrl">
          <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=92x92&data=${encodeURIComponent(qrcodeUrl)}`" alt="查询二维码" class="qr-img" />
          <div class="qr-tip">扫码查看合格证</div>
        </div>
        <div v-else class="rh-side rh-spacer"></div>
      </div>

      <table class="report-table">
        <tbody>
          <tr>
            <th>受检单位</th>
            <td colspan="3">{{ companyName }}</td>
          </tr>
          <tr>
            <th>联系人</th>
            <td>{{ contactName }}</td>
            <th>联系电话</th>
            <td>{{ contactPhone }}</td>
          </tr>
          <tr>
            <th>单位地址</th>
            <td colspan="3">{{ companyAddress }}</td>
          </tr>
          <tr>
            <th>样品名称</th>
            <td>{{ record?.sample_name || record?.product_name || '—' }}</td>
            <th>样品数量</th>
            <td>
              <input v-model="report.sampleQuantity" class="cell-input" placeholder="如 5 kg" />
            </td>
          </tr>
          <tr>
            <th>产地</th>
            <td colspan="3">
              <input v-model="report.origin" class="cell-input" placeholder="如 山西太原" />
            </td>
          </tr>
          <tr>
            <th>检测时间</th>
            <td>{{ record ? formatDateTime(record.test_time) : '—' }}</td>
            <th>记录编号</th>
            <td>{{ record?.record_no || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">一、检测项目及结果</div>
      <table class="report-table result-table">
        <thead>
          <tr>
            <th style="width: 22%">检测项目</th>
            <th style="width: 22%">检测方法</th>
            <th style="width: 16%">检测值</th>
            <th style="width: 12%">单位</th>
            <th style="width: 16%">限量值</th>
            <th style="width: 12%">判定</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in record?.items || []" :key="idx">
            <td>{{ item.test_item || '—' }}</td>
            <td>{{ item.test_method || '—' }}</td>
            <td>{{ item.test_value || '—' }}</td>
            <td>{{ item.unit || '—' }}</td>
            <td>{{ item.standard_limit || '—' }}</td>
            <td :class="item.result === 'qualified' ? 'ok' : 'no'">{{ resultText(item.result) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">二、检测依据 / 判定标准 *</div>
      <div class="basis-box">
        <input v-model="report.testBasis" class="basis-input" />
      </div>

      <div class="section-title">三、检测结论</div>
      <div class="conclusion">
        经快速检测，该样品所检项目中农药残留量
        <strong :class="overallPass ? 'ok' : 'no'">
          {{ overallPass ? '符合' : '不符合' }}
        </strong>
        相关限量要求，检测结论为
        <strong :class="overallPass ? 'ok' : 'no'">
          {{ overallPass ? '合格' : '不合格' }}
        </strong>。
      </div>

      <div class="sign-area">
        <div class="sign-col">
          <div class="sign-label">检测人 *</div>
          <div class="sign-line">
            <input v-model="report.tester" class="cell-input center" placeholder="签名" />
          </div>
        </div>
        <div class="sign-col">
          <div class="sign-label">审核人 *</div>
          <div class="sign-line">
            <input v-model="report.reviewer" class="cell-input center" placeholder="签名" />
          </div>
        </div>
        <div class="sign-col">
          <div class="sign-label">签发日期 *</div>
          <div class="sign-line">
            <input v-model="report.issueDate" class="cell-input center" type="date" />
          </div>
        </div>
      </div>

      <div class="report-footer">
        本报告由受检单位自检出具，依据快速检测方法判定，仅供参考，不作为第三方权威检测结论。
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-page {
  padding: 20px 24px 60px;
}
.report-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.report-sheet {
  background: #fff;
  width: 794px;
  max-width: 100%;
  margin: 0 auto;
  padding: 48px 56px;
  border: 1px solid #e2ece7;
  box-shadow: 0 8px 24px rgba(6, 45, 40, 0.06);
  color: #14241f;
  font-size: 14px;
  line-height: 1.7;
}
.report-header {
  display: flex;
  align-items: flex-end;
  border-bottom: 3px double #0a7f58;
  padding-bottom: 10px;
  margin-bottom: 16px;
}
.rh-side {
  width: 110px;
  flex-shrink: 0;
}
.rh-spacer {
  visibility: hidden;
}
.rh-center {
  flex: 1;
  text-align: center;
}
.rh-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #062d28;
}
.rh-no {
  margin-top: 10px;
  font-size: 13px;
  color: #0a7f58;
  font-weight: 700;
}
.rh-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
}
.report-table th,
.report-table td {
  border: 1px solid #cfdfd8;
  padding: 9px 12px;
  text-align: left;
  vertical-align: middle;
}
.report-table th {
  background: #f3f8f5;
  font-weight: 700;
  width: 14%;
  white-space: nowrap;
}
.result-table {
  table-layout: fixed;
}
.result-table th {
  text-align: center;
  background: #0a7f58;
  color: #fff;
}
.result-table td {
  text-align: center;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.cell-input {
  border: none;
  border-bottom: 1px dashed #b9d3c7;
  width: 100%;
  font-size: 14px;
  padding: 2px 0;
  color: #14241f;
  outline: none;
  background: transparent;
}
.cell-input.center {
  text-align: center;
}
.section-title {
  font-size: 15px;
  font-weight: 800;
  color: #062d28;
  margin: 22px 0 10px;
  padding-left: 10px;
  border-left: 4px solid #0a7f58;
}
.basis-box {
  border: 1px solid #cfdfd8;
  padding: 10px 12px;
}
.basis-input {
  border: none;
  width: 100%;
  font-size: 14px;
  outline: none;
  color: #14241f;
}
.conclusion {
  border: 1px solid #cfdfd8;
  padding: 14px 16px;
  background: #fafdfb;
}
.conclusion .ok {
  color: #0a7f58;
}
.conclusion .no {
  color: #c0392b;
}
.sign-area {
  display: flex;
  gap: 40px;
  margin-top: 30px;
}
.sign-col {
  flex: 1;
}
.sign-label {
  font-size: 13px;
  color: #62756d;
  margin-bottom: 8px;
}
.sign-line {
  border-bottom: 1px solid #14241f;
  height: 36px;
  display: flex;
  align-items: flex-end;
}
.qr-img {
  width: 92px;
  height: 92px;
  border: 1px solid #e2ece7;
}
.qr-tip {
  font-size: 10px;
  color: #8a9a93;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}
.report-footer {
  margin-top: 28px;
  padding-top: 14px;
  border-top: 1px solid #e2ece7;
  font-size: 12px;
  color: #8a9a93;
  text-align: center;
}
.ok {
  color: #0a7f58;
  font-weight: 700;
}
.no {
  color: #c0392b;
  font-weight: 700;
}

@media print {
  .no-print {
    display: none !important;
  }
  .report-page {
    padding: 0;
  }
  .report-sheet {
    box-shadow: none;
    border: none;
    width: 100%;
    padding: 0;
  }
}
</style>
