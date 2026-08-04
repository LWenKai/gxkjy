<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>帮助与说明</h1>
      </div>
    </div>

    <div class="help-grid">
      <div v-for="section in sections" :key="section.title" class="panel help-card">
        <h2>{{ section.title }}</h2>
        <ol>
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ol>
      </div>
    </div>

    <div class="panel muted-panel">
      <h2>交付说明</h2>
      <p>系统已支持检测记录、合格证开具、扫码查询、依据资料上传和合格证打印。检测仪厂家上传数据联调时，可在厂家上传日志中排查上传结果。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
const sections = [
  {
    title: '客户开通',
    items: [
      '先在企业管理中创建企业，并填写联系人、电话、服务期限。',
      '进入企业详情，创建客户账号，并复制客户使用信息。',
      '绑定检测设备，必要时维护企业公开资料。',
      '录入或接收检测数据后，开具一张合格证完成交付核验。',
    ],
  },
  {
    title: '日常演示',
    items: [
      '数据看板用于查看企业、设备、检测记录、合格证整体情况。',
      '检测记录可查看合格、不合格、异常、隐藏、作废等状态。',
      '合格证详情可复制扫码链接、查看打印记录和依据资料。',
      '扫码公开页用于给采购方或公众查看当前合格证状态。',
    ],
  },
  {
    title: '问题排查',
    items: [
      '客户无法登录时，先检查企业状态、服务期限和企业账号状态。',
      '无法开证时，检查检测记录是否合格、是否正常、是否选择了承诺依据。',
      '真实检测仪对接后，可在厂家上传日志中查看签名、设备绑定和数据格式问题。',
      '打印异常时，先检查打印机连接、纸张尺寸和打印记录。',
    ],
  },
];
</script>

<style scoped>
.help-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.help-card h2 {
  color: var(--guxin-green-deep);
  font-size: 18px;
}

.help-card ol {
  color: var(--guxin-muted);
  line-height: 1.9;
  margin: 12px 0 0;
  padding-left: 20px;
}

@media (max-width: 1100px) {
  .help-grid {
    grid-template-columns: 1fr;
  }
}
</style>
