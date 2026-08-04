<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>{{ detail?.company_name || '客户详情' }}</h1>
        <p v-if="detail">
          {{ detail.customer_no }} · {{ label(customerStatusOptions, detail.status) }} ·
          {{ label(customerValueOptions, detail.value_level) }}
        </p>
      </div>
    </div>

    <div v-if="detail" class="detail-layout" v-loading="loading">
      <div class="panel summary-card">
        <div>
          <span>联系人</span>
          <strong>{{ detail.contact_name || '-' }}</strong>
          <small>{{ detail.phone || detail.wechat || '-' }}</small>
        </div>
        <div>
          <span>地区</span>
          <strong>{{ [detail.province, detail.city].filter(Boolean).join(' / ') || '-' }}</strong>
          <small>{{ detail.address || '-' }}</small>
        </div>
        <div>
          <span>客户类型</span>
          <strong>{{ label(customerTypeOptions, detail.customer_type) }}</strong>
          <small>{{ label(customerSourceOptions, detail.source) }}</small>
        </div>
        <div>
          <span>近期复购</span>
          <strong>{{ detail.repurchase_reminders.length }} 项</strong>
          <small>待联系或即将到期的产品</small>
        </div>
      </div>

      <div class="panel quick-maintain">
        <div>
          <strong>客户经营流程</strong>
          <span>先录入线索和沟通情况，再制作报价；成交后开通企业端，用于客户登录小程序、绑定设备和开证。</span>
        </div>
        <div class="quick-buttons">
          <el-button @click="switchAndAdd('needs', 'need')">补充需求</el-button>
          <el-button @click="switchAndAdd('devices', 'device')">登记设备</el-button>
          <el-button @click="switchAndAdd('follow', 'follow')">记录跟进</el-button>
          <el-button @click="switchAndAdd('quotes')">制作报价单</el-button>
          <el-button type="primary" plain @click="goCreateCompany">开通企业端</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="panel">
        <el-tab-pane label="客户资料" name="base">
          <div class="tab-head">
            <h3>客户资料</h3>
            <el-button type="primary" @click="openBasicEdit">编辑资料</el-button>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="企业名称">{{ detail.company_name }}</el-descriptions-item>
            <el-descriptions-item label="客户编号">{{ detail.customer_no }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detail.contact_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="微信">{{ detail.wechat || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ detail.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ detail.remark || '暂无备注' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="需求场景" name="needs">
          <SectionToolbar title="客户需求记录" description="记录客户想买什么、用于什么场景、需要检测哪些项目。" />
          <el-table :data="detail.needs" border empty-text="暂无需求记录">
            <el-table-column label="需求类型" min-width="130">
              <template #default="{ row }: { row: CustomerNeed }">{{ label(customerNeedOptions, row.need_type) }}</template>
            </el-table-column>
            <el-table-column prop="product_category" label="产品类别" min-width="130" />
            <el-table-column prop="test_project" label="检测项目" min-width="160" />
            <el-table-column prop="remark" label="备注" min-width="220" />
            <el-table-column label="操作" width="90">
              <template #default="{ row }: { row: CustomerNeed }">
                <el-button link type="danger" @click="removeRecord('needs', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="设备档案" name="devices">
          <SectionToolbar title="客户已有设备" description="用于判断后续耗材匹配、维修升级和复购机会。" />
          <el-table :data="detail.devices" border empty-text="暂无设备档案">
            <el-table-column prop="manufacturer" label="设备品牌" min-width="140" />
            <el-table-column prop="model" label="型号" min-width="140" />
            <el-table-column prop="device_count" label="数量" width="80" />
            <el-table-column label="购买时间" width="130">
              <template #default="{ row }: { row: CustomerDeviceRecord }">{{ row.purchase_date ? formatDate(row.purchase_date) : '-' }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="220" />
            <el-table-column label="操作" width="90">
              <template #default="{ row }: { row: CustomerDeviceRecord }">
                <el-button link type="danger" @click="removeRecord('devices', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="沟通跟进" name="follow">
          <SectionToolbar title="沟通跟进记录" description="记录电话、微信、上门沟通内容和下次跟进时间。" />
          <el-timeline v-if="detail.follow_records.length">
            <el-timeline-item
              v-for="record in detail.follow_records"
              :key="record.id"
              :timestamp="formatDateTime(record.follow_time)"
            >
              <div class="timeline-card">
                <strong>{{ label(followTypeOptions, record.follow_type) }}</strong>
                <p>{{ record.content }}</p>
                <small v-if="record.next_follow_date">下次跟进：{{ formatDate(record.next_follow_date) }}</small>
                <el-button link type="danger" @click="removeRecord('follow-records', record.id)">删除</el-button>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无跟进记录" />
        </el-tab-pane>

        <el-tab-pane label="报价单" name="quotes">
          <SectionToolbar title="报价单记录" description="报价从当前客户内制作，历史版本保留；正式报价生成后不可直接覆盖。" />
          <el-alert
            class="mb-16"
            type="info"
            show-icon
            :closable="false"
            title="报价单优先从销售产品库选择产品。老客户复购时可优先带出上次成交价，需要调价时复制新版本。"
          />
          <el-table :data="detail.sales_quotes || []" border empty-text="暂无正式报价单">
            <el-table-column type="expand">
              <template #default="{ row }: { row: SalesQuote }">
                <el-table :data="row.items" border size="small">
                  <el-table-column prop="product_name" label="产品名称" min-width="180" />
                  <el-table-column label="型号" min-width="120">
                    <template #default="{ row: item }: { row: SalesQuoteItem }">
                      {{ item.model || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="specification" label="规格配置" min-width="180" />
                  <el-table-column label="数量" width="110">
                    <template #default="{ row: item }: { row: SalesQuoteItem }">{{ item.quantity }} {{ item.unit || '' }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_price" label="单价" width="110" />
                  <el-table-column prop="subtotal" label="小计" width="110" />
                  <el-table-column prop="item_remark" label="备注" min-width="160" />
                </el-table>
              </template>
            </el-table-column>
            <el-table-column prop="quote_no" label="报价编号" min-width="180" />
            <el-table-column prop="version_no" label="版本" width="80" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }: { row: SalesQuote }">{{ salesLabel(salesQuoteStatusOptions, row.status) }}</template>
            </el-table-column>
            <el-table-column prop="item_count" label="项数" width="80" />
            <el-table-column prop="total_amount" label="总金额" width="120" />
            <el-table-column label="报价日期" width="120">
              <template #default="{ row }: { row: SalesQuote }">{{ formatDate(row.quote_date) }}</template>
            </el-table-column>
            <el-table-column label="文件" width="160">
              <template #default="{ row }: { row: SalesQuote }">
                <el-button link :disabled="!row.has_pdf" @click="openFilePreview(row, 'pdf')">PDF</el-button>
                <el-button link :disabled="!row.has_excel" @click="openFilePreview(row, 'excel')">Excel</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="290" fixed="right">
              <template #default="{ row }: { row: SalesQuote }">
                <el-button link type="primary" @click="openQuoteDialog(row)">查看</el-button>
                <el-button v-if="row.status === 'DRAFT'" link type="success" @click="generateQuote(row)">生成</el-button>
                <el-button link type="warning" :disabled="Boolean(row.converted_order_count)" @click="openOrderDialog(row)">转订单</el-button>
                <el-button link @click="createVersion(row)">复制调价</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="成交订单" name="orders">
          <SectionToolbar title="成交订单与复购提醒" description="客户确认报价后转成交订单，在这里维护付款、发货、开票和复购提醒。" />
          <div class="delivery-panel">
            <div>
              <strong>成交后的交付开通</strong>
              <p>客户成交后，需要到企业管理创建正式企业，再进入企业详情创建账号、绑定设备、维护公开资料和测试开证。</p>
            </div>
            <el-button type="primary" @click="goCreateCompany">开通企业端</el-button>
          </div>
          <el-alert
            v-if="detail.repurchase_reminders.length"
            class="mb-16"
            type="warning"
            show-icon
            :closable="false"
            title="存在需要跟进的复购提醒，可直接生成复购报价或标记跟进结果。"
          />
          <div v-if="detail.repurchase_reminders.length" class="reminder-panel">
            <div class="reminder-title">
              <strong>待跟进复购提醒</strong>
              <span>只显示已到期或7天内需要联系的产品</span>
            </div>
            <el-table :data="detail.repurchase_reminders" border size="small">
              <el-table-column prop="product_name" label="产品" min-width="180" />
              <el-table-column label="数量" width="110">
                <template #default="{ row }: { row: CustomerPurchaseItem }">{{ row.quantity || '-' }} {{ row.unit || '' }}</template>
              </el-table-column>
              <el-table-column label="上次成交" width="110">
                <template #default="{ row }: { row: CustomerPurchaseItem }">{{ row.unit_price || row.subtotal || '-' }}</template>
              </el-table-column>
              <el-table-column label="预计补货" width="130">
                <template #default="{ row }: { row: CustomerPurchaseItem }">{{ row.next_repurchase_date ? formatDate(row.next_repurchase_date) : '-' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }: { row: CustomerPurchaseItem }">{{ salesLabel(repurchaseStatusOptions, row.repurchase_status) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="250">
                <template #default="{ row }: { row: CustomerPurchaseItem }">
                  <el-button link type="primary" @click="makeRepurchaseQuote(row)">生成复购报价</el-button>
                  <el-button link @click="setReminderStatus(row, 'CONTACTED')">已联系</el-button>
                  <el-button link type="warning" @click="setReminderStatus(row, 'NO_NEED')">暂不需要</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-table :data="detail.purchase_orders || []" border empty-text="暂无成交订单">
            <el-table-column type="expand">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">
                <el-table :data="row.items" border size="small">
                  <el-table-column prop="product_name" label="产品" min-width="180" />
                  <el-table-column prop="brand" label="品牌" width="120" />
                  <el-table-column prop="model" label="型号" width="120" />
                  <el-table-column prop="specification" label="规格" min-width="140" />
                  <el-table-column label="数量" width="100">
                    <template #default="{ row: item }: { row: CustomerPurchaseItem }">{{ item.quantity }} {{ item.unit || '' }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_price" label="成交单价" width="110" />
                  <el-table-column prop="subtotal" label="小计" width="100" />
                  <el-table-column label="复购提醒" width="110">
                    <template #default="{ row: item }: { row: CustomerPurchaseItem }">
                      <el-tag :type="item.repeat_reminder_enabled ? 'success' : 'info'">
                        {{ item.repeat_reminder_enabled ? '提醒' : '不提醒' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="预计补货" width="130">
                    <template #default="{ row: item }: { row: CustomerPurchaseItem }">{{ item.next_repurchase_date ? formatDate(item.next_repurchase_date) : '-' }}</template>
                  </el-table-column>
                  <el-table-column label="复购状态" width="120">
                    <template #default="{ row: item }: { row: CustomerPurchaseItem }">{{ salesLabel(repurchaseStatusOptions, item.repurchase_status) }}</template>
                  </el-table-column>
                </el-table>
              </template>
            </el-table-column>
            <el-table-column prop="order_no" label="订单编号" min-width="150" />
            <el-table-column prop="quote_no_snapshot" label="来源报价" min-width="170" />
            <el-table-column label="成交日期" width="120">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">{{ formatDate(row.deal_date || row.purchase_date) }}</template>
            </el-table-column>
            <el-table-column prop="item_count" label="产品数" width="90" />
            <el-table-column prop="total_amount" label="订单总额" width="110" />
            <el-table-column label="付款" width="130">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">
                <el-select v-model="row.payment_status" size="small">
                  <el-option v-for="item in paymentStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="发货" width="130">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">
                <el-select v-model="row.delivery_status" size="small">
                  <el-option v-for="item in deliveryStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="快递公司" width="150">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">
                <el-input v-model="row.express_company" size="small" placeholder="快递公司" />
              </template>
            </el-table-column>
            <el-table-column label="快递单号" width="180">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">
                <el-input v-model="row.tracking_no" size="small" placeholder="快递单号" />
              </template>
            </el-table-column>
            <el-table-column label="最近补货" width="130">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">{{ row.nearest_repurchase_date ? formatDate(row.nearest_repurchase_date) : '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }: { row: CustomerPurchaseOrder }">
                <el-button link type="success" :loading="savingOrderId === row.id" @click="saveOrderInline(row)">保存</el-button>
                <el-button link type="primary" @click="openOrderEditDialog(row)">编辑订单</el-button>
                <el-button link type="danger" @click="removePurchaseOrder(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="secondary-action">
            <el-button @click="openDirectOrderDialog">录入无报价订单</el-button>
            <span>仅用于线下已成交但没有报价单的特殊情况，正常流程建议先制作报价单。</span>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-else-if="!loading" description="客户不存在或已删除" />

    <el-dialog v-model="basicDialogVisible" title="编辑基础资料" width="720px">
      <el-form :model="basicForm" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="企业名称"><el-input v-model="basicForm.company_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系人"><el-input v-model="basicForm.contact_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="电话"><el-input v-model="basicForm.phone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="微信"><el-input v-model="basicForm.wechat" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="客户类型"><el-select v-model="basicForm.customer_type"><el-option v-for="item in customerTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="阶段"><el-select v-model="basicForm.status"><el-option v-for="item in customerStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="来源"><el-select v-model="basicForm.source"><el-option v-for="item in customerSourceOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="价值"><el-select v-model="basicForm.value_level"><el-option v-for="item in customerValueOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="basicForm.remark" type="textarea" :rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="basicDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveBasic">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialogVisible" :title="recordDialogTitle" width="640px">
      <el-form :model="recordForm" label-width="110px">
        <template v-if="recordType === 'need'">
          <el-form-item label="需求类型"><el-select v-model="recordForm.need_type"><el-option v-for="item in customerNeedOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="产品类别"><el-input v-model="recordForm.product_category" placeholder="蔬菜水果、肉类、水产品等" /></el-form-item>
          <el-form-item label="检测项目"><el-input v-model="recordForm.test_project" /></el-form-item>
        </template>
        <template v-else-if="recordType === 'device'">
          <el-form-item label="设备品牌"><el-input v-model="recordForm.manufacturer" /></el-form-item>
          <el-form-item label="设备型号"><el-input v-model="recordForm.model" /></el-form-item>
          <el-form-item label="数量"><el-input-number v-model="recordForm.device_count" :min="1" /></el-form-item>
          <el-form-item label="购买时间"><el-date-picker v-model="recordForm.purchase_date" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        </template>
        <template v-else-if="recordType === 'follow'">
          <el-form-item label="跟进时间"><el-date-picker v-model="recordForm.follow_time" value-format="YYYY-MM-DD" type="date" /></el-form-item>
          <el-form-item label="沟通方式"><el-select v-model="recordForm.follow_type"><el-option v-for="item in followTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="沟通内容"><el-input v-model="recordForm.content" type="textarea" :rows="4" /></el-form-item>
          <el-form-item label="下次跟进"><el-date-picker v-model="recordForm.next_follow_date" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input v-model="recordForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="quoteDialogVisible" :title="quoteDialogTitle" width="1180px" class="quote-edit-dialog">
      <el-form :model="quoteForm" label-width="118px" :disabled="quoteLocked" class="quote-form">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="客户"><el-input :model-value="detail?.company_name || ''" disabled /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="报价日期"><el-date-picker v-model="quoteForm.quote_date" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="有效期"><el-date-picker v-model="quoteForm.valid_until" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="价格说明"><el-input v-model="quoteForm.invoice_note" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="运输费用"><el-input v-model="quoteForm.shipping_note" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="交付时间"><el-input v-model="quoteForm.delivery_note" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="付款方式"><el-input v-model="quoteForm.payment_note" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="售后服务"><el-input v-model="quoteForm.after_sales_note" /></el-form-item></el-col>
        </el-row>

        <div class="order-tools">
          <strong>报价产品明细</strong>
          <div class="order-tool-actions">
            <el-button @click="openPackageSelect">添加套餐</el-button>
            <el-button type="primary" @click="addQuoteItem">添加产品</el-button>
          </div>
        </div>
        <el-table :data="quoteForm.items" border>
          <el-table-column label="销售产品" min-width="220">
            <template #default="{ row }: { row: Record<string, any> }">
              <el-select v-model="row.sales_product_id" filterable remote reserve-keyword placeholder="搜索产品" :remote-method="searchProducts" @change="onQuoteProductSelected(row)">
                <el-option v-for="product in productOptions" :key="product.id" :label="productOptionLabel(product)" :value="product.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" min-width="160"><template #default="{ row }"><el-input v-model="row.product_name" /></template></el-table-column>
          <el-table-column label="规格配置" min-width="160"><template #default="{ row }"><el-input v-model="row.specification" /></template></el-table-column>
          <el-table-column label="数量" width="105"><template #default="{ row }"><el-input v-model="row.quantity" @input="recalcItem(row)" /></template></el-table-column>
          <el-table-column label="单位" width="80"><template #default="{ row }"><el-input v-model="row.unit" /></template></el-table-column>
          <el-table-column label="价格来源" width="150">
            <template #default="{ row }">
              <el-select v-model="row.price_source" @change="applyPriceSource(row)">
                <el-option :label="row.last_unit_price ? `上次成交价 ${row.last_unit_price}` : '上次成交价'" value="last" :disabled="!row.last_unit_price" />
                <el-option :label="row.default_unit_price ? `产品库价格 ${row.default_unit_price}` : '产品库未维护价格'" value="default" :disabled="!row.default_unit_price" />
                <el-option v-if="row.price_source === 'package'" label="套餐价格" value="package" disabled />
                <el-option label="手动填写" value="manual" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120"><template #default="{ row }"><el-input v-model="row.unit_price" @input="recalcItem(row)" /></template></el-table-column>
          <el-table-column label="小计" width="110"><template #default="{ row }">{{ row.subtotal || '0.00' }}</template></el-table-column>
          <el-table-column label="备注" min-width="130"><template #default="{ row }"><el-input v-model="row.item_remark" /></template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{ $index }"><el-button link type="danger" @click="quoteForm.items.splice($index, 1)">删除</el-button></template></el-table-column>
        </el-table>
        <div class="total-line">报价总金额：<strong>{{ quoteTotal }}</strong> 元</div>
        <el-form-item label="其他备注"><el-input v-model="quoteForm.remark" type="textarea" :rows="2" resize="none" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quoteDialogVisible = false">取消</el-button>
        <el-button v-if="quoteLocked && currentQuote" type="primary" @click="createVersion(currentQuote)">基于此报价复制新版</el-button>
        <template v-else>
          <el-button :loading="saving" @click="saveQuoteDraft">保存草稿</el-button>
          <el-button type="primary" :loading="saving" @click="saveAndGenerateQuote">生成正式报价</el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog v-model="packageSelectVisible" title="添加销售套餐" width="560px">
      <el-form label-width="96px">
        <el-form-item label="选择套餐">
          <el-select
            v-model="selectedPackageId"
            filterable
            remote
            reserve-keyword
            placeholder="搜索套餐名称"
            :remote-method="searchPackages"
            style="width: 100%"
          >
            <el-option
              v-for="pkg in packageOptions"
              :key="pkg.id"
              :label="packageOptionLabel(pkg)"
              :value="pkg.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="selectedPackage" class="package-select-summary">
        <strong>{{ selectedPackage.name }}</strong>
        <span>{{ selectedPackage.item_count }} 项产品，套餐合计 {{ selectedPackage.total_amount }} 元</span>
      </div>
      <template #footer>
        <el-button @click="packageSelectVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedPackage" @click="appendSelectedPackage">加入报价单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orderDialogVisible" :title="orderDialogTitle" width="980px">
      <div class="dialog-guide">
        <strong>订单只维护成交后的事项</strong>
        <span>产品和金额来自报价单；这里主要维护付款、发货、开票和每项产品是否需要复购提醒。</span>
      </div>
      <el-form :model="orderForm" label-width="118px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="成交日期"><el-date-picker v-model="orderForm.deal_date" value-format="YYYY-MM-DD" type="date" @change="refreshOrderReminderDates" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="预计交付"><el-date-picker v-model="orderForm.expected_delivery_date" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="实际交付"><el-date-picker v-model="orderForm.actual_delivery_date" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="付款状态"><el-select v-model="orderForm.payment_status"><el-option v-for="item in paymentStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="发货状态"><el-select v-model="orderForm.delivery_status"><el-option v-for="item in deliveryStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="是否开票"><el-switch v-model="orderForm.invoice_issued" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="快递公司"><el-input v-model="orderForm.express_company" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="快递单号"><el-input v-model="orderForm.tracking_no" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="发票类型"><el-input v-model="orderForm.invoice_type" /></el-form-item></el-col>
        </el-row>
        <el-alert
          v-if="orderMode === 'convert'"
          type="info"
          show-icon
          :closable="false"
          title="产品和金额从报价单自动带入。只需要补充成交、付款、发货和每项产品的复购提醒。"
        />
        <div class="order-tools">
          <strong>订单产品明细</strong>
          <el-button v-if="orderMode === 'direct'" type="primary" @click="addOrderItem">添加产品</el-button>
        </div>
        <el-table :data="orderForm.items" border>
          <el-table-column label="产品" min-width="170">
            <template #default="{ row }: { row: Record<string, any> }">
              <el-select
                v-if="orderMode === 'direct'"
                v-model="row.sales_product_id"
                filterable
                remote
                reserve-keyword
                placeholder="搜索产品"
                :remote-method="searchProducts"
                @change="onOrderProductSelected(row)"
              >
                <el-option v-for="product in productOptions" :key="product.id" :label="productOptionLabel(product)" :value="product.id" />
              </el-select>
              <span v-else>{{ row.product_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="105"><template #default="{ row }"><el-input v-model="row.quantity" :disabled="orderMode === 'convert'" @input="recalcItem(row)" /></template></el-table-column>
          <el-table-column label="单位" width="80"><template #default="{ row }"><el-input v-model="row.unit" :disabled="orderMode === 'convert'" /></template></el-table-column>
          <el-table-column label="成交单价" width="120"><template #default="{ row }"><el-input v-model="row.unit_price" :disabled="orderMode === 'convert'" @input="recalcItem(row)" /></template></el-table-column>
          <el-table-column label="小计" width="110"><template #default="{ row }">{{ row.subtotal || '0.00' }}</template></el-table-column>
          <el-table-column label="提醒" width="85"><template #default="{ row }"><el-switch v-model="row.repeat_reminder_enabled" @change="onReminderToggle(row)" /></template></el-table-column>
          <el-table-column label="实际周期" width="130"><template #default="{ row }"><el-input-number v-model="row.actual_cycle_days" :min="1" :disabled="!row.repeat_reminder_enabled" controls-position="right" @change="updateRepurchaseDate(row)" /></template></el-table-column>
          <el-table-column label="补货日期" width="150"><template #default="{ row }"><el-date-picker v-model="row.next_repurchase_date" value-format="YYYY-MM-DD" type="date" :disabled="!row.repeat_reminder_enabled" /></template></el-table-column>
          <el-table-column v-if="orderMode === 'edit'" label="复购状态" width="130">
            <template #default="{ row }">
              <el-select v-model="row.repurchase_status">
                <el-option v-for="item in repurchaseStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-if="orderMode === 'direct'" label="操作" width="80"><template #default="{ $index }"><el-button link type="danger" @click="orderForm.items.splice($index, 1)">删除</el-button></template></el-table-column>
        </el-table>
        <div class="total-line">订单总金额：<strong>{{ orderTotal }}</strong> 元</div>
        <el-form-item label="订单备注" class="mt-12"><el-input v-model="orderForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveOrder">保存订单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="quotePreviewVisible" :title="previewTitle" width="980px" class="quote-preview-dialog">
      <div v-if="previewQuote" class="quote-preview-page">
        <div class="quote-preview-header">
          <div>
            <h2>山西谷芯科技有限公司</h2>
            <p>联系电话：13363412262</p>
            <p>食品安全快检设备、耗材与合格证打印配套</p>
          </div>
          <div class="quote-preview-no">
            <strong>报价单</strong>
            <span>{{ previewQuote.quote_no }}</span>
          </div>
        </div>

        <div class="quote-preview-section">
          <h3>客户与报价信息</h3>
          <div class="quote-info-grid">
            <span>客户单位</span><strong>{{ detail?.company_name || '-' }}</strong>
            <span>报价编号</span><strong>{{ previewQuote.quote_no }}</strong>
            <span>联系人</span><strong>{{ detail?.contact_name || '-' }}</strong>
            <span>报价日期</span><strong>{{ formatDate(previewQuote.quote_date) }}</strong>
            <span>联系电话</span><strong>{{ detail?.phone || '-' }}</strong>
            <span>有效期至</span><strong>{{ formatDate(previewQuote.valid_until) }}</strong>
          </div>
        </div>

        <div class="quote-preview-section">
          <h3>产品及服务明细</h3>
          <table class="quote-preview-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>产品名称</th>
                <th>型号</th>
                <th>规格或配置</th>
                <th>数量</th>
                <th>单位</th>
                <th>单价</th>
                <th>小计</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in previewQuote.items" :key="item.id || index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.product_name }}</td>
                <td>{{ item.model || '-' }}</td>
                <td>{{ item.specification || '-' }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit || '-' }}</td>
                <td>{{ item.unit_price }}</td>
                <td>{{ item.subtotal }}</td>
                <td>{{ item.item_remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="quote-preview-total">
            <div>
              <span>人民币大写</span>
              <em>{{ previewQuote.total_amount_cn || amountToChinese(previewQuote.total_amount) }}</em>
            </div>
            <div>
              <span>合计金额</span>
              <strong>¥ {{ previewQuote.total_amount }}</strong>
            </div>
          </div>
        </div>

        <div class="quote-preview-section">
          <h3>商务条款</h3>
          <dl class="quote-terms">
            <dt>价格说明</dt><dd>{{ quoteTerm(previewQuote, 'invoice_note') }}</dd>
            <dt>运输费用</dt><dd>{{ quoteTerm(previewQuote, 'shipping_note') }}</dd>
            <dt>交付时间</dt><dd>{{ quoteTerm(previewQuote, 'delivery_note') }}</dd>
            <dt>付款方式</dt><dd>{{ quoteTerm(previewQuote, 'payment_note') }}</dd>
            <dt>售后服务</dt><dd>{{ quoteTerm(previewQuote, 'after_sales_note') }}</dd>
          </dl>
          <p class="quote-preview-note">本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="quotePreviewVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadPreviewFile">下载{{ previewFileType === 'pdf' ? 'PDF' : 'Excel' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import {
  addCustomerDevice,
  addCustomerFollowRecord,
  addCustomerNeed,
  deleteCustomerRecord,
  getCustomer,
  updateCustomer,
} from '@/api/customers';
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrder,
  updateRepurchaseStatus,
} from '@/api/purchaseOrders';
import { listSalesProducts } from '@/api/salesProducts';
import { listSalesProductPackages } from '@/api/salesProductPackages';
import {
  convertSalesQuoteToOrder,
  createRepurchaseQuote,
  createSalesQuote,
  createSalesQuoteVersion,
  downloadSalesQuoteFile,
  generateSalesQuoteFiles,
  updateSalesQuote,
  updateSalesQuoteStatus,
} from '@/api/salesQuotes';
import { listCompanies } from '@/api/companies';
import type {
  CustomerDetail,
  CustomerDeviceRecord,
  CustomerNeed,
  CustomerPurchaseItem,
  CustomerPurchaseOrder,
  RepurchaseStatus,
  SalesProduct,
  SalesProductPackage,
  SalesQuote,
  SalesQuoteItem,
} from '@/types/api';
import {
  customerNeedOptions,
  customerSourceOptions,
  customerStatusOptions,
  customerTypeOptions,
  customerValueOptions,
  followTypeOptions,
  optionLabel,
} from '@/utils/customerLabels';
import { formatDateTime } from '@/utils/time';
import {
  deliveryStatusOptions,
  paymentStatusOptions,
  repurchaseStatusOptions,
  salesOptionLabel,
  salesQuoteStatusOptions,
} from '@/utils/salesLabels';

const SectionToolbar = defineComponent({
  props: { title: String, description: String, button: String, secondary: Boolean },
  emits: ['add'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'section-toolbar' }, [
        h('div', [
          h('h3', props.title),
          props.description ? h('p', props.description) : null,
        ]),
        props.button
          ? h(
              'button',
              {
                class: ['toolbar-button', props.secondary ? 'secondary' : ''],
                type: 'button',
                onClick: () => emit('add'),
              },
              props.button,
            )
          : null,
      ]);
  },
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const savingOrderId = ref('');
const detail = ref<CustomerDetail | null>(null);
const activeTab = ref('base');
const basicDialogVisible = ref(false);
const recordDialogVisible = ref(false);
const quoteDialogVisible = ref(false);
const orderDialogVisible = ref(false);
const packageSelectVisible = ref(false);
const quotePreviewVisible = ref(false);
const recordType = ref<'need' | 'device' | 'follow'>('need');
const productOptions = ref<SalesProduct[]>([]);
const packageOptions = ref<SalesProductPackage[]>([]);
const selectedPackageId = ref('');
const currentQuote = ref<SalesQuote | null>(null);
const previewQuote = ref<SalesQuote | null>(null);
const previewFileType = ref<'pdf' | 'excel'>('pdf');
const currentOrder = ref<CustomerPurchaseOrder | null>(null);
const orderMode = ref<'convert' | 'edit' | 'direct'>('convert');
const quoteTermDefaults = {
  invoice_note: '以上报价为含税价格，可开具增值税普通发票。',
  shipping_note: '运输方式及费用根据实际订单确认。',
  delivery_note: '收到货款后3-7个工作日内安排发货，特殊产品或项目以双方确认时间为准。',
  payment_note: '客户确认报价后付款，款到安排采购及发货。',
  after_sales_note: '提供产品使用指导及相关售后支持，具体服务内容以本报价单备注或双方签订的合同为准。',
};

const customerId = computed(() => String(route.params.id || ''));
const quoteLocked = computed(() => Boolean(currentQuote.value && currentQuote.value.status !== 'DRAFT'));
const quoteDialogTitle = computed(() => {
  if (!currentQuote.value) return '新增报价单';
  return quoteLocked.value ? '查看正式报价' : '编辑报价草稿';
});
const orderDialogTitle = computed(() => {
  if (orderMode.value === 'convert') return '转为成交订单';
  if (orderMode.value === 'direct') return '新增直接订单';
  return '编辑成交订单';
});
const previewTitle = computed(() => (previewFileType.value === 'pdf' ? 'PDF报价单预览' : 'Excel报价单预览'));
const recordDialogTitle = computed(() => {
  const map = {
    need: '新增需求',
    device: '新增设备档案',
    follow: '新增跟进记录',
  };
  return map[recordType.value];
});

const basicForm = reactive<Record<string, any>>({});
const recordForm = reactive<Record<string, any>>({});
const quoteForm = reactive<Record<string, any>>({});
const orderForm = reactive<Record<string, any>>({});

const quoteTotal = computed(() =>
  (quoteForm.items || []).reduce((sum: number, item: Record<string, any>) => sum + Number(item.subtotal || 0), 0).toFixed(2),
);
const selectedPackage = computed(() => packageOptions.value.find((item) => item.id === selectedPackageId.value) || null);
const orderTotal = computed(() =>
  (orderForm.items || []).reduce((sum: number, item: Record<string, any>) => sum + Number(item.subtotal || 0), 0).toFixed(2),
);

onMounted(async () => {
  await loadData();
  applyRouteIntent();
});

async function loadData() {
  loading.value = true;
  try {
    detail.value = await getCustomer(customerId.value);
  } finally {
    loading.value = false;
  }
}

function applyRouteIntent() {
  const tab = String(route.query.tab || '');
  const validTabs = ['base', 'needs', 'devices', 'follow', 'quotes', 'orders'];
  if (validTabs.includes(tab)) activeTab.value = tab;
}

function openBasicEdit() {
  if (!detail.value) return;
  Object.assign(basicForm, {
    company_name: detail.value.company_name,
    contact_name: detail.value.contact_name || '',
    phone: detail.value.phone || '',
    wechat: detail.value.wechat || '',
    customer_type: detail.value.customer_type,
    source: detail.value.source,
    status: detail.value.status,
    value_level: detail.value.value_level,
    remark: detail.value.remark || '',
  });
  basicDialogVisible.value = true;
}

async function saveBasic() {
  if (!basicForm.company_name) {
    ElMessage.warning('请输入企业名称');
    return;
  }
  saving.value = true;
  try {
    await updateCustomer(customerId.value, basicForm);
    ElMessage.success('基础资料已保存');
    basicDialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

function openRecordDialog(type: typeof recordType.value) {
  recordType.value = type;
  Object.keys(recordForm).forEach((key) => delete recordForm[key]);
  const today = new Date().toISOString().slice(0, 10);
  if (type === 'need') Object.assign(recordForm, { need_type: 'EQUIPMENT' });
  if (type === 'device') Object.assign(recordForm, { device_count: 1 });
  if (type === 'follow') Object.assign(recordForm, { follow_time: today, follow_type: 'PHONE', content: '' });
  recordDialogVisible.value = true;
}

function switchAndAdd(tab: string, type?: typeof recordType.value) {
  activeTab.value = tab;
  if (type) openRecordDialog(type);
  else if (tab === 'quotes') openQuoteDialog();
}

async function goCreateCompany() {
  if (!detail.value) return;
  const normalizedName = detail.value.company_name.trim();
  const normalizedPhone = String(detail.value.phone || '').trim().replace(/\s+/g, '');

  const existing = await listCompanies({
    page: 1,
    page_size: 20,
    name: normalizedName,
  }).then((result) =>
    result.items.find((item) => {
      const itemName = item.name.trim();
      const itemPhone = String(item.phone || '').trim().replace(/\s+/g, '');
      return itemName === normalizedName || (normalizedPhone && itemPhone === normalizedPhone);
    }),
  );

  if (existing) {
    try {
      await ElMessageBox.confirm(
        `企业端已存在「${existing.name}」，不需要重复创建。是否进入已有企业继续维护账号、设备和资料？`,
        '企业已存在',
        {
          confirmButtonText: '进入已有企业',
          cancelButtonText: '留在当前页',
          type: 'warning',
        },
      );
      router.push(`/companies/${existing.id}`);
    } catch {
      // 用户选择留在当前页。
    }
    return;
  }

  router.push({
    path: '/companies',
    query: {
      action: 'create',
      from: 'customer',
      customer_id: customerId.value,
      name: detail.value.company_name,
      contact_name: detail.value.contact_name || '',
      phone: detail.value.phone || '',
      address: detail.value.address || [detail.value.province, detail.value.city].filter(Boolean).join(' '),
    },
  });
}

async function saveRecord() {
  saving.value = true;
  try {
    if (recordType.value === 'need') await addCustomerNeed(customerId.value, recordForm);
    if (recordType.value === 'device') await addCustomerDevice(customerId.value, recordForm);
    if (recordType.value === 'follow') await addCustomerFollowRecord(customerId.value, recordForm);
    ElMessage.success('记录已保存');
    recordDialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

function openQuoteDialog(row?: SalesQuote) {
  if (!detail.value) return;
  activeTab.value = 'quotes';
  resetReactive(quoteForm);
  currentQuote.value = row || null;
  const today = new Date().toISOString().slice(0, 10);
  const valid = new Date();
  valid.setDate(valid.getDate() + 7);
  Object.assign(
    quoteForm,
    row
      ? {
          customer_id: customerId.value,
          quote_date: formatDate(row.quote_date),
          valid_until: row.valid_until ? formatDate(row.valid_until) : '',
          invoice_note: row.invoice_note || '',
          shipping_note: row.shipping_note || '',
          delivery_note: row.delivery_note || '',
          payment_note: row.payment_note || '',
          after_sales_note: row.after_sales_note || '',
          remark: row.remark || '',
          items: row.items.map((item) => ({
            ...item,
            sales_product_id: item.sales_product_id || '',
            source_package_id: item.source_package_id || '',
            source_package_name: item.source_package_name || '',
            item_remark: item.item_remark || '',
            price_source: 'manual',
            last_unit_price: '',
            default_unit_price: '',
          })),
        }
      : {
          customer_id: customerId.value,
          quote_date: today,
          valid_until: valid.toISOString().slice(0, 10),
          invoice_note: '以上报价为含税价格，可开具增值税普通发票。',
          shipping_note: '运输方式及费用根据实际订单确认。',
          delivery_note: '收到货款后3-7个工作日内安排发货，特殊产品或项目以双方确认时间为准。',
          payment_note: '客户确认报价后付款，款到安排采购及发货。',
          after_sales_note: '提供产品使用指导及相关售后支持，具体服务内容以本报价单备注或双方签订的合同为准。',
          items: [],
        },
  );
  if (!quoteForm.items.length) addQuoteItem();
  searchProducts('');
  quoteDialogVisible.value = true;
}

function addQuoteItem() {
  quoteForm.items.push(createBlankQuoteItem());
}

function createBlankQuoteItem() {
  return {
    sales_product_id: '',
    source_package_id: '',
    source_package_name: '',
    product_name: '',
    brand: '',
    model: '',
    specification: '',
    unit: '件',
    quantity: '1',
    unit_price: '',
    subtotal: '0.00',
    item_remark: '',
    price_source: 'default',
    last_unit_price: '',
    default_unit_price: '',
  };
}

async function searchProducts(keyword: string) {
  const result = await listSalesProducts({
    page: 1,
    page_size: 30,
    keyword,
    is_active: true,
  });
  productOptions.value = result.items;
}

async function searchPackages(keyword: string) {
  const result = await listSalesProductPackages({
    page: 1,
    page_size: 30,
    keyword,
    is_active: true,
  });
  packageOptions.value = result.items;
}

function openPackageSelect() {
  selectedPackageId.value = '';
  searchPackages('');
  packageSelectVisible.value = true;
}

function packageOptionLabel(pkg: SalesProductPackage) {
  return `${pkg.name} / ${pkg.item_count}项 / ¥${pkg.total_amount}`;
}

function appendSelectedPackage() {
  const pkg = selectedPackage.value;
  if (!pkg) return;
  const appendItems = pkg.items.map((item) => ({
    sales_product_id: item.sales_product_id || '',
    source_package_id: pkg.id,
    source_package_name: pkg.name,
    product_name: item.product_name,
    brand: item.brand || '',
    model: item.model || '',
    specification: item.specification || '',
    unit: item.unit || '件',
    quantity: item.quantity || '1',
    unit_price: item.unit_price || '0.00',
    subtotal: item.subtotal || '0.00',
    item_remark: item.item_remark || '',
    price_source: 'package',
    last_unit_price: '',
    default_unit_price: '',
  }));
  if (quoteForm.items.length === 1 && !quoteForm.items[0].product_name) {
    quoteForm.items.splice(0, 1, ...appendItems);
  } else {
    quoteForm.items.push(...appendItems);
  }
  packageSelectVisible.value = false;
}

function onQuoteProductSelected(row: Record<string, any>) {
  const product = productOptions.value.find((item) => item.id === row.sales_product_id);
  if (!product) return;
  fillProductSnapshot(row, product);
  row.source_package_id = '';
  row.source_package_name = '';
  const last = findLastPurchaseItem(product.id);
  row.last_unit_price = last?.unit_price || '';
  row.default_unit_price = product.default_sale_price || '';
  row.price_source = row.last_unit_price ? 'last' : row.default_unit_price ? 'default' : 'manual';
  applyPriceSource(row);
}

function onOrderProductSelected(row: Record<string, any>) {
  const product = productOptions.value.find((item) => item.id === row.sales_product_id);
  if (!product) return;
  fillProductSnapshot(row, product);
  row.unit_price = product.default_sale_price || '0.00';
  row.repeat_reminder_enabled = Boolean(product.repeat_reminder_enabled);
  row.reference_cycle_days = product.reference_cycle_days || product.default_cycle_days || undefined;
  row.actual_cycle_days = product.reference_cycle_days || product.default_cycle_days || undefined;
  row.reminder_days_before = product.default_reminder_days_before || 7;
  if (row.repeat_reminder_enabled) updateRepurchaseDate(row);
  recalcItem(row);
}

function fillProductSnapshot(row: Record<string, any>, product: SalesProduct) {
  row.product_name = product.name;
  row.brand = product.brand || '';
  row.model = product.model || '';
  row.specification = product.specification || '';
  row.unit = product.unit || '件';
}

function productOptionLabel(product: SalesProduct) {
  const model = product.model;
  return `${product.name}${model ? ' / ' + model : ''}`;
}

function findLastPurchaseItem(productId: string) {
  const orders = [...(detail.value?.purchase_orders || [])].sort((a, b) =>
    String(b.deal_date || b.purchase_date).localeCompare(String(a.deal_date || a.purchase_date)),
  );
  for (const order of orders) {
    const item = order.items.find((orderItem) => orderItem.sales_product_id === productId);
    if (item) return item;
  }
  return null;
}

function applyPriceSource(row: Record<string, any>) {
  if (row.price_source === 'last' && row.last_unit_price) row.unit_price = row.last_unit_price;
  if (row.price_source === 'default') row.unit_price = row.default_unit_price || '';
  recalcItem(row);
}

function recalcItem(row: Record<string, any>) {
  row.subtotal = (Number(row.quantity || 0) * Number(row.unit_price || 0)).toFixed(2);
}

function onReminderToggle(row: Record<string, any>) {
  if (!row.repeat_reminder_enabled) {
    row.next_repurchase_date = '';
    return;
  }
  row.actual_cycle_days = row.actual_cycle_days || row.reference_cycle_days || row.expected_cycle_days || 30;
  row.reminder_days_before = row.reminder_days_before || 7;
  updateRepurchaseDate(row);
}

function updateRepurchaseDate(row: Record<string, any>) {
  if (!row.repeat_reminder_enabled || !row.actual_cycle_days) return;
  const base = orderForm.deal_date || orderForm.purchase_date || new Date().toISOString().slice(0, 10);
  const date = new Date(base);
  date.setDate(date.getDate() + Number(row.actual_cycle_days || 0));
  row.next_repurchase_date = date.toISOString().slice(0, 10);
}

function refreshOrderReminderDates() {
  (orderForm.items || []).forEach((item: Record<string, any>) => {
    if (item.repeat_reminder_enabled && item.actual_cycle_days) updateRepurchaseDate(item);
  });
}

async function saveQuoteDraft() {
  const quote = await saveQuote();
  if (quote) {
    ElMessage.success('报价草稿已保存');
    quoteDialogVisible.value = false;
    await loadData();
  }
}

async function saveAndGenerateQuote() {
  if (quoteForm.items.some((item: Record<string, any>) => item.unit_price === '' || item.unit_price === undefined || item.unit_price === null)) {
    ElMessage.warning('正式报价中存在未填写单价的产品，请先完善价格');
    return;
  }
  if (quoteForm.items.some((item: Record<string, any>) => Number(item.unit_price) < 0)) {
    ElMessage.warning('报价单价不能小于 0');
    return;
  }
  const quote = await saveQuote();
  if (!quote) return;
  await generateSalesQuoteFiles(quote.id);
  ElMessage.success('正式报价文件已生成');
  quoteDialogVisible.value = false;
  await loadData();
}

async function saveQuote() {
  if (!quoteForm.customer_id) {
    ElMessage.warning('客户信息异常，请刷新后重试');
    return null;
  }
  if (!quoteForm.items.length || quoteForm.items.some((item: Record<string, any>) => !item.product_name || Number(item.quantity) <= 0)) {
    ElMessage.warning('请完善报价产品和数量');
    return null;
  }
  saving.value = true;
  try {
    const payload = buildQuotePayload();
    return currentQuote.value
      ? await updateSalesQuote(currentQuote.value.id, payload)
      : await createSalesQuote(payload);
  } finally {
    saving.value = false;
  }
}

function buildQuotePayload() {
  return {
    customer_id: customerId.value,
    quote_date: quoteForm.quote_date,
    valid_until: quoteForm.valid_until,
    invoice_note: quoteForm.invoice_note,
    shipping_note: quoteForm.shipping_note,
    delivery_note: quoteForm.delivery_note,
    payment_note: quoteForm.payment_note,
    after_sales_note: quoteForm.after_sales_note,
    remark: quoteForm.remark,
    items: quoteForm.items.map((item: Record<string, any>, index: number) => {
      const unitPrice = item.unit_price === '' || item.unit_price === undefined || item.unit_price === null ? '' : String(item.unit_price);
      return {
        sales_product_id: item.sales_product_id || undefined,
        source_package_id: item.source_package_id || undefined,
        source_package_name: item.source_package_name || undefined,
        product_name: item.product_name,
        brand: item.brand || undefined,
        model: item.model || undefined,
        specification: item.specification || undefined,
        unit: item.unit || undefined,
        quantity: String(item.quantity || '0'),
        unit_price: unitPrice,
        item_remark: quoteItemRemark(item) || undefined,
        sort_order: index + 1,
      };
    }),
  };
}

function quoteItemRemark(item: Record<string, any>) {
  const remark = String(item.item_remark || '').trim();
  const defaultPrice = Number(item.default_unit_price || 0);
  const unitPrice = Number(item.unit_price || 0);
  if (defaultPrice > 0 && unitPrice === 0 && !remark.includes('原价')) {
    return remark ? `原价 ${item.default_unit_price} 元，本次报价 0 元；${remark}` : `原价 ${item.default_unit_price} 元，本次报价 0 元`;
  }
  return remark;
}

async function generateQuote(row: SalesQuote) {
  await generateSalesQuoteFiles(row.id);
  ElMessage.success('正式报价文件已生成');
  await loadData();
}

async function createVersion(row: SalesQuote) {
  const version = await createSalesQuoteVersion(row.id);
  ElMessage.success('已复制为新版本，可继续调整价格和产品');
  await loadData();
  openQuoteDialog(version);
}

async function openOrderDialog(row: SalesQuote) {
  activeTab.value = 'orders';
  if (row.status === 'DRAFT') {
    await ElMessageBox.confirm('该报价还是草稿。是否先生成正式报价文件，再转为成交订单？', '生成报价', { type: 'warning' });
    row = await generateSalesQuoteFiles(row.id);
  }
  currentQuote.value = row;
  currentOrder.value = null;
  orderMode.value = 'convert';
  resetReactive(orderForm);
  Object.assign(orderForm, {
    customer_id: customerId.value,
    deal_date: new Date().toISOString().slice(0, 10),
    payment_status: 'UNPAID',
    delivery_status: 'PENDING',
    invoice_issued: false,
    items: row.items.map((item) => ({
      quote_item_id: item.id,
      product_name: item.product_name,
      sales_product_id: item.sales_product_id || '',
      quantity: item.quantity,
      unit: item.unit || '',
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      repeat_reminder_enabled: item.sales_product?.repeat_reminder_enabled || false,
      reference_cycle_days: item.sales_product?.reference_cycle_days || undefined,
      actual_cycle_days: item.sales_product?.reference_cycle_days || undefined,
      reminder_days_before: item.sales_product?.default_reminder_days_before || 7,
      next_repurchase_date: '',
      repurchase_status: 'PENDING',
    })),
  });
  refreshOrderReminderDates();
  orderDialogVisible.value = true;
}

async function openDirectOrderDialog() {
  await ElMessageBox.confirm('正常流程建议先生成报价，再转为成交订单。确认要新增一张未关联报价的直接订单吗？', '新增直接订单', { type: 'warning' });
  activeTab.value = 'orders';
  currentQuote.value = null;
  currentOrder.value = null;
  orderMode.value = 'direct';
  resetReactive(orderForm);
  Object.assign(orderForm, {
    customer_id: customerId.value,
    purchase_date: new Date().toISOString().slice(0, 10),
    deal_date: new Date().toISOString().slice(0, 10),
    payment_status: 'UNPAID',
    delivery_status: 'PENDING',
    invoice_issued: false,
    items: [],
  });
  await searchProducts('');
  addOrderItem();
  orderDialogVisible.value = true;
}

function openOrderEditDialog(row: CustomerPurchaseOrder) {
  activeTab.value = 'orders';
  currentOrder.value = row;
  currentQuote.value = null;
  orderMode.value = 'edit';
  resetReactive(orderForm);
  Object.assign(orderForm, {
    customer_id: customerId.value,
    purchase_date: formatDate(row.purchase_date),
    deal_date: row.deal_date ? formatDate(row.deal_date) : formatDate(row.purchase_date),
    expected_delivery_date: row.expected_delivery_date ? formatDate(row.expected_delivery_date) : '',
    actual_delivery_date: row.actual_delivery_date ? formatDate(row.actual_delivery_date) : '',
    payment_status: row.payment_status,
    delivery_status: row.delivery_status,
    express_company: row.express_company || '',
    tracking_no: row.tracking_no || '',
    invoice_issued: Boolean(row.invoice_issued),
    invoice_type: row.invoice_type || '',
    remark: row.remark || '',
    items: row.items.map((item) => ({
      ...item,
      sales_product_id: item.sales_product_id || '',
      next_repurchase_date: item.next_repurchase_date ? formatDate(item.next_repurchase_date) : '',
      reference_cycle_days: item.actual_cycle_days || item.expected_cycle_days || undefined,
      actual_cycle_days: item.actual_cycle_days || undefined,
      reminder_days_before: item.reminder_days_before || 7,
      repeat_reminder_enabled: Boolean(item.repeat_reminder_enabled),
    })),
  });
  orderDialogVisible.value = true;
}

function addOrderItem() {
  orderForm.items.push({
    sales_product_id: '',
    product_name: '',
    brand: '',
    model: '',
    specification: '',
    unit: '件',
    quantity: '1',
    unit_price: '0.00',
    subtotal: '0.00',
    repeat_reminder_enabled: false,
    reference_cycle_days: undefined,
    actual_cycle_days: undefined,
    reminder_days_before: 7,
    next_repurchase_date: '',
    repurchase_status: 'PENDING',
    remark: '',
  });
}

async function saveOrder() {
  if (!orderForm.items.length) {
    ElMessage.warning('请至少保留一项产品');
    return;
  }
  saving.value = true;
  try {
    if (orderMode.value === 'convert' && currentQuote.value) {
      await convertSalesQuoteToOrder(currentQuote.value.id, buildConvertOrderPayload());
      ElMessage.success('已转为成交订单');
    } else if (orderMode.value === 'edit' && currentOrder.value) {
      await updatePurchaseOrder(currentOrder.value.id, buildPurchaseOrderPayload());
      ElMessage.success('订单已更新');
    } else {
      await createPurchaseOrder(buildPurchaseOrderPayload());
      ElMessage.success('直接订单已保存');
    }
    orderDialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

async function saveOrderInline(row: CustomerPurchaseOrder) {
  savingOrderId.value = row.id;
  try {
    await updatePurchaseOrder(row.id, buildPurchaseOrderPayloadFromRow(row));
    ElMessage.success('订单状态已保存');
    await loadData();
  } finally {
    savingOrderId.value = '';
  }
}

async function makeRepurchaseQuote(row: CustomerPurchaseItem) {
  const quote = await createRepurchaseQuote(row.id);
  ElMessage.success('已生成复购报价，可在报价单里调整数量和价格');
  activeTab.value = 'quotes';
  await loadData();
  openQuoteDialog(quote);
}

async function setReminderStatus(row: CustomerPurchaseItem, status: RepurchaseStatus) {
  await updateRepurchaseStatus(row.id, status);
  ElMessage.success('复购提醒状态已更新');
  await loadData();
}

function buildConvertOrderPayload() {
  return {
    deal_date: orderForm.deal_date,
    expected_delivery_date: orderForm.expected_delivery_date || undefined,
    actual_delivery_date: orderForm.actual_delivery_date || undefined,
    payment_status: orderForm.payment_status,
    delivery_status: orderForm.delivery_status,
    express_company: orderForm.express_company || undefined,
    tracking_no: orderForm.tracking_no || undefined,
    invoice_issued: orderForm.invoice_issued === true,
    invoice_type: orderForm.invoice_type || undefined,
    remark: orderForm.remark || undefined,
    items: orderForm.items.map((item: Record<string, any>) => ({
      quote_item_id: item.quote_item_id,
      repeat_reminder_enabled: item.repeat_reminder_enabled === true,
      actual_cycle_days: item.repeat_reminder_enabled ? item.actual_cycle_days || undefined : undefined,
      reminder_days_before: item.repeat_reminder_enabled ? item.reminder_days_before || 7 : undefined,
      next_repurchase_date: item.repeat_reminder_enabled ? item.next_repurchase_date || undefined : undefined,
    })),
  };
}

function buildPurchaseOrderPayloadFromRow(row: CustomerPurchaseOrder) {
  return {
    customer_id: row.customer_id,
    purchase_date: dateValue(row.purchase_date || row.deal_date),
    deal_date: dateValue(row.deal_date || row.purchase_date),
    expected_delivery_date: dateValue(row.expected_delivery_date),
    actual_delivery_date: dateValue(row.actual_delivery_date),
    payment_status: row.payment_status,
    delivery_status: row.delivery_status,
    express_company: row.express_company || undefined,
    tracking_no: row.tracking_no || undefined,
    invoice_issued: row.invoice_issued === true,
    invoice_type: row.invoice_type || undefined,
    remark: row.remark || undefined,
    items: row.items.map((item) => ({
      sales_product_id: item.sales_product_id || undefined,
      product_name: item.product_name,
      brand: item.brand || undefined,
      model: item.model || undefined,
      specification: item.specification || undefined,
      unit: item.unit || undefined,
      quantity: String(item.quantity || '0'),
      unit_price: String(item.unit_price || '0'),
      repeat_reminder_enabled: item.repeat_reminder_enabled === true,
      actual_cycle_days: item.repeat_reminder_enabled ? item.actual_cycle_days || undefined : undefined,
      reminder_days_before: item.repeat_reminder_enabled ? item.reminder_days_before || 7 : undefined,
      next_repurchase_date: item.repeat_reminder_enabled ? dateValue(item.next_repurchase_date) : undefined,
      repurchase_status: item.repurchase_status,
      remark: item.remark || undefined,
    })),
  };
}

function buildPurchaseOrderPayload() {
  return {
    customer_id: customerId.value,
    purchase_date: orderForm.purchase_date || orderForm.deal_date,
    deal_date: orderForm.deal_date,
    expected_delivery_date: orderForm.expected_delivery_date || undefined,
    actual_delivery_date: orderForm.actual_delivery_date || undefined,
    payment_status: orderForm.payment_status,
    delivery_status: orderForm.delivery_status,
    express_company: orderForm.express_company || undefined,
    tracking_no: orderForm.tracking_no || undefined,
    invoice_issued: orderForm.invoice_issued === true,
    invoice_type: orderForm.invoice_type || undefined,
    remark: orderForm.remark || undefined,
    items: orderForm.items.map((item: Record<string, any>) => ({
      sales_product_id: item.sales_product_id || undefined,
      product_name: item.product_name,
      brand: item.brand || undefined,
      model: item.model || undefined,
      specification: item.specification || undefined,
      unit: item.unit || undefined,
      quantity: String(item.quantity || '0'),
      unit_price: String(item.unit_price || '0'),
      repeat_reminder_enabled: item.repeat_reminder_enabled === true,
      actual_cycle_days: item.repeat_reminder_enabled ? item.actual_cycle_days || undefined : undefined,
      reminder_days_before: item.repeat_reminder_enabled ? item.reminder_days_before || 7 : undefined,
      next_repurchase_date: item.repeat_reminder_enabled ? item.next_repurchase_date || undefined : undefined,
      remark: item.remark || undefined,
    })),
  };
}

async function removePurchaseOrder(id: string) {
  await ElMessageBox.confirm('确认删除这张成交订单？删除后会从当前列表隐藏。', '删除成交订单', { type: 'warning' });
  await deletePurchaseOrder(id);
  ElMessage.success('成交订单已删除');
  await loadData();
}

async function removeRecord(
  type: 'needs' | 'devices' | 'follow-records',
  id: string,
) {
  await ElMessageBox.confirm('确认删除这条记录？删除后会从当前列表隐藏。', '删除记录', {
    type: 'warning',
  });
  await deleteCustomerRecord(type, id);
  ElMessage.success('记录已删除');
  await loadData();
}

function openFilePreview(row: SalesQuote, type: 'pdf' | 'excel') {
  previewQuote.value = row;
  previewFileType.value = type;
  quotePreviewVisible.value = true;
}

async function downloadPreviewFile() {
  if (!previewQuote.value) return;
  await downloadSalesQuoteFile(previewQuote.value.id, previewFileType.value);
}

function quoteTerm(row: SalesQuote, key: keyof typeof quoteTermDefaults) {
  return String((row as unknown as Record<string, string | null | undefined>)[key] || quoteTermDefaults[key]);
}

function resetReactive(target: Record<string, any>) {
  Object.keys(target).forEach((key) => delete target[key]);
}

function label(options: Array<{ label: string; value: string }>, value?: string | null) {
  return optionLabel(options, value);
}

function salesLabel(options: Array<{ label: string; value: string }>, value?: string | null) {
  return salesOptionLabel(options, value);
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : undefined;
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-';
}

function amountToChinese(value?: string | number | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '零元整';
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const sections = ['', '万', '亿'];
  const [integerPart, decimalPart = ''] = Math.abs(amount).toFixed(2).split('.');

  let sectionIndex = 0;
  let result = '';
  let integer = Number(integerPart);
  while (integer > 0) {
    const section = integer % 10000;
    if (section !== 0) {
      result = `${sectionToChinese(section, digit, units)}${sections[sectionIndex]}${result}`;
    } else if (!result.startsWith('零') && result) {
      result = `零${result}`;
    }
    integer = Math.floor(integer / 10000);
    sectionIndex += 1;
  }

  const yuan = result || '零';
  const jiao = Number(decimalPart[0] || 0);
  const fen = Number(decimalPart[1] || 0);
  const decimalText = `${jiao ? `${digit[jiao]}角` : ''}${fen ? `${digit[fen]}分` : ''}` || '整';
  return `${amount < 0 ? '负' : ''}${yuan}元${decimalText}`.replace(/零+/g, '零').replace(/零元/, '元');
}

function sectionToChinese(section: number, digit: string[], units: string[]) {
  let str = '';
  let zero = false;
  for (let i = 0; i < 4; i += 1) {
    const n = section % 10;
    if (n === 0) {
      if (str && !zero) {
        zero = true;
        str = `零${str}`;
      }
    } else {
      zero = false;
      str = `${digit[n]}${units[i]}${str}`;
    }
    section = Math.floor(section / 10);
  }
  return str.replace(/零+$/, '');
}
</script>

<style scoped>
.detail-layout {
  display: grid;
  gap: 16px;
}

.summary-card {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-card div {
  background: #f7fbf9;
  border-radius: 8px;
  padding: 14px;
}

.summary-card span,
.summary-card small {
  color: #64748b;
  display: block;
  font-size: 13px;
}

.summary-card strong {
  color: #063b31;
  display: block;
  font-size: 20px;
  margin: 6px 0 4px;
}

.quick-maintain {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.quick-maintain strong {
  color: #063b31;
  display: block;
  font-size: 16px;
  margin-bottom: 4px;
}

.quick-maintain span {
  color: #64748b;
  font-size: 13px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.quick-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

.tab-head,
.section-toolbar,
.order-tools,
.total-line {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 0 0 12px;
}

.order-tool-actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.package-select-summary {
  background: #f3fbf7;
  border: 1px solid #d7eee4;
  border-radius: 10px;
  color: #064e3b;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
}

.package-select-summary span {
  color: #64748b;
  font-size: 13px;
}

.tab-head h3,
.section-toolbar h3 {
  color: #063b31;
  font-size: 16px;
  margin: 0;
}

.section-toolbar p {
  color: #64748b;
  font-size: 13px;
  margin: 5px 0 0;
}

.secondary-action {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
}

.delivery-panel {
  align-items: center;
  background: linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%);
  border: 1px solid #b7ead5;
  border-radius: 10px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 14px 16px;
}

.delivery-panel strong {
  color: #063b31;
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.delivery-panel p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
}

.secondary-action span {
  font-size: 13px;
}

.dialog-guide {
  align-items: center;
  background: #f3faf7;
  border: 1px solid #dbe7e2;
  border-radius: 8px;
  color: #64748b;
  display: flex;
  gap: 12px;
  margin: 0 0 14px;
  padding: 12px 14px;
}

.dialog-guide strong {
  color: #063b31;
  white-space: nowrap;
}

.dialog-guide span {
  font-size: 13px;
  line-height: 1.6;
}

.reminder-panel {
  background: #fffaf0;
  border: 1px solid #fde3b1;
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 12px;
}

.reminder-title {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.reminder-title strong {
  color: #92400e;
}

.reminder-title span {
  color: #9a6a28;
  font-size: 13px;
}

.toolbar-button {
  background: #0f9b6f;
  border: 0;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  padding: 8px 14px;
}

.toolbar-button.secondary {
  background: #e8f4ef;
  color: #0f6f52;
}

.timeline-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.timeline-card p {
  margin: 8px 0;
  white-space: pre-wrap;
}

.timeline-card small {
  color: #64748b;
  display: block;
}

.total-line {
  color: #063b31;
  justify-content: flex-end;
  gap: 8px;
  font-size: 16px;
  margin-top: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-12 {
  margin-top: 12px;
}

.quote-preview-dialog :deep(.el-dialog__body) {
  background: #f1f5f4;
  max-height: 72vh;
  overflow: auto;
}

.quote-edit-dialog :deep(.el-dialog__body) {
  overflow-x: hidden;
}

.quote-edit-dialog :deep(textarea) {
  resize: none;
}

.quote-form :deep(.el-table .el-input__wrapper),
.quote-form :deep(.el-table .el-select__wrapper) {
  min-height: 34px;
}

.quote-preview-page {
  background: #fff;
  box-shadow: 0 16px 40px rgba(15, 35, 30, 0.12);
  color: #1f2937;
  margin: 0 auto;
  min-height: 980px;
  padding: 34px 38px;
  width: 780px;
}

.quote-preview-header {
  align-items: flex-start;
  background:
    radial-gradient(circle at 92% 0%, rgba(15, 143, 88, 0.12), transparent 32%),
    linear-gradient(135deg, #f7fbf9, #ffffff);
  border: 1px solid #dbe7e2;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 24px 26px;
}

.quote-preview-header h2 {
  color: #063b31;
  font-size: 24px;
  margin: 0 0 8px;
}

.quote-preview-header p {
  color: #475569;
  line-height: 1.7;
  margin: 0;
}

.quote-preview-no {
  text-align: right;
}

.quote-preview-no strong {
  color: #063b31;
  display: block;
  font-size: 34px;
  letter-spacing: 6px;
  margin-bottom: 10px;
}

.quote-preview-no span {
  color: #64748b;
  font-size: 13px;
}

.quote-preview-section {
  margin-top: 24px;
}

.quote-preview-section h3 {
  border-bottom: 2px solid #0f9b6f;
  color: #0f6f52;
  font-size: 16px;
  margin: 0 0 12px;
  padding-bottom: 8px;
}

.quote-info-grid {
  border: 1px solid #dbe7e2;
  display: grid;
  grid-template-columns: 110px 1fr 110px 1fr;
}

.quote-info-grid span,
.quote-info-grid strong {
  border-bottom: 1px solid #dbe7e2;
  border-right: 1px solid #dbe7e2;
  min-height: 38px;
  padding: 10px 12px;
}

.quote-info-grid span {
  background: #f3faf7;
  color: #0f6f52;
  font-weight: 700;
}

.quote-info-grid strong {
  color: #1f2937;
  font-weight: 600;
}

.quote-preview-table {
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
}

.quote-preview-table th,
.quote-preview-table td {
  border: 1px solid #dbe7e2;
  line-height: 1.45;
  padding: 8px 7px;
  text-align: left;
  vertical-align: top;
}

.quote-preview-table th {
  background: #eef8f3;
  color: #063b31;
  font-weight: 700;
}

.quote-preview-total {
  align-items: flex-end;
  background: #f8fafc;
  border: 1px solid #dbe7e2;
  border-top: 0;
  display: grid;
  grid-template-columns: 1fr 230px;
  padding: 0;
}

.quote-preview-total div {
  display: grid;
  gap: 8px;
  min-height: 64px;
  padding: 14px 18px;
}

.quote-preview-total div + div {
  border-left: 1px solid #dbe7e2;
  justify-items: end;
}

.quote-preview-total span {
  color: #64748b;
  font-size: 13px;
}

.quote-preview-total em {
  color: #063b31;
  font-style: normal;
  font-weight: 700;
  line-height: 1.5;
}

.quote-preview-total strong {
  color: #063b31;
  font-size: 24px;
  line-height: 1.2;
}

.quote-terms {
  border: 1px solid #dbe7e2;
  display: grid;
  grid-template-columns: 110px 1fr;
  margin: 0;
}

.quote-terms dt,
.quote-terms dd {
  border-bottom: 1px solid #dbe7e2;
  margin: 0;
  padding: 10px 12px;
}

.quote-terms dt {
  background: #f3faf7;
  color: #0f6f52;
  font-weight: 700;
}

.quote-preview-note {
  color: #64748b;
  font-size: 13px;
  line-height: 1.8;
  margin: 12px 0 0;
}

@media (max-width: 1100px) {
  .summary-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-maintain {
    align-items: flex-start;
    flex-direction: column;
  }

  .quick-buttons {
    justify-content: flex-start;
  }
}
</style>
