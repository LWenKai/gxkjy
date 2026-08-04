<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  defaultSettings,
  fetchWebsiteMaterials,
  fetchWebsiteSettings,
  type WebsiteMaterial,
  type WebsiteSettings,
} from './api';

const settings = ref<WebsiteSettings>(defaultSettings);
const materials = ref<WebsiteMaterial[]>([]);
const loading = ref(true);

const heroTitle = computed(() =>
  settings.value.home_title === '食品安全快检室整体解决方案'
    ? defaultSettings.home_title
    : settings.value.home_title,
);

const heroSubtitle = computed(() =>
  settings.value.home_subtitle === '检测设备、试剂耗材、合格证打印、数据管理与扫码查询一站式配套'
    ? defaultSettings.home_subtitle
    : settings.value.home_subtitle,
);

const recommendedMaterials = computed(() =>
  materials.value.filter((item) => item.is_recommended).slice(0, 4),
);

const visibleMaterials = computed(() =>
  materials.value.slice().sort((a, b) => a.sort_order - b.sort_order).slice(0, 12),
);

const navItems = [
  ['方案', '#solutions'],
  ['产品服务', '#services'],
  ['快检云', '#cloud'],
  ['建设流程', '#process'],
  ['资料', '#materials'],
  ['联系', '#contact'],
];

const capabilityCards = [
  {
    title: '快检室整体配置',
    text: '围绕检测项目、场地条件、使用人员和管理要求，给出基础型、标准型、提升型配置建议。',
  },
  {
    title: '设备与耗材配套',
    text: '覆盖农残、兽残、常见食品安全项目相关仪器、试剂耗材、前处理工具和日常补给。',
  },
  {
    title: '合格证打印闭环',
    text: '把检测记录、承诺达标合格证、标签打印和扫码查询串起来，减少重复录入。',
  },
  {
    title: '数据管理工具',
    text: '谷芯快检云支持检测记录留存、合格证开具、公开查询、企业资料展示和打印记录管理。',
  },
];

const scenarioCards = [
  {
    title: '农产品合作社 / 种植基地',
    pain: '日常抽检、上市前开证、客户验收资料留存。',
    solution: '配置农残快检设备、常用试剂耗材、合格证打印和扫码查询能力。',
  },
  {
    title: '食材配送企业',
    pain: '出库前检测、学校或团餐客户留档、批次记录追溯。',
    solution: '围绕蔬菜、水果、肉蛋等配送品类，建立检测记录和开证流程。',
  },
  {
    title: '学校食堂 / 单位食堂',
    pain: '采购验收、留样、快检记录和日常管理需要更规范。',
    solution: '提供基础快检设备、耗材、台账和操作指导，降低人员上手难度。',
  },
  {
    title: '食品加工企业',
    pain: '原料入厂、过程抽检、出厂前检查需要可查记录。',
    solution: '按原料类别和检测项目组合设备、耗材和资料留存方式。',
  },
  {
    title: '农贸市场 / 便民市场',
    pain: '摊位抽检、公示、消费者信任和市场管理资料归档。',
    solution: '配置现场快检、公开展示和合格证/检测信息扫码查询能力。',
  },
  {
    title: '项目型快检室配套',
    pain: '设备、耗材、打印、培训、数据管理需要统一落地。',
    solution: '按项目要求拆解清单，协助形成可执行的建设和运行方案。',
  },
];

const serviceCards = [
  ['食品安全检测仪器', '多参数检测、农残检测、常见食品安全项目快检设备配置建议。'],
  ['试剂耗材补给', '按检测项目和使用频次配置常用试剂、耗材和前处理工具。'],
  ['合格证打印设备', '配套标签打印、二维码查询和承诺达标合格证开具流程。'],
  ['快检室台面配套', '样品处理、检测操作、资料留存等基础配套建议。'],
  ['谷芯快检云', '检测记录、合格证、扫码公开页和打印记录管理。'],
  ['安装培训与售后', '根据项目情况提供安装指导、操作培训、远程支持和耗材补给提醒。'],
];

const processSteps = [
  ['01', '需求判断', '确认客户场景、检测项目、日均检测量和开证需求。'],
  ['02', '配置清单', '输出设备、耗材、打印、数据平台和配套工具建议。'],
  ['03', '现场落地', '按场地条件安排安装指导、账号配置和操作培训。'],
  ['04', '试运行', '用真实样品流程跑通检测、开证、打印和扫码查询。'],
  ['05', '资料留存', '形成日常检测记录、合格证记录和公开查询资料。'],
  ['06', '后续支持', '提供耗材补给、使用答疑和后续设备数据适配沟通。'],
];

const packageTypes = [
  {
    title: '基础型',
    tag: '适合起步使用',
    text: '满足常见快检、基础台账、少量合格证打印和日常管理。',
  },
  {
    title: '标准型',
    tag: '适合稳定运行',
    text: '适合配送、合作社、食堂等需要稳定检测、留档和扫码查询的场景。',
  },
  {
    title: '提升型',
    tag: '适合项目配套',
    text: '面向检测项目更多、管理要求更高、需要多角色协同和资料归档的客户。',
  },
];

onMounted(async () => {
  try {
    const [siteSettings, siteMaterials] = await Promise.all([
      fetchWebsiteSettings(),
      fetchWebsiteMaterials(),
    ]);
    settings.value = siteSettings;
    materials.value = siteMaterials;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="谷芯科技首页">
        <span class="brand-mark">GX</span>
        <span>
          <strong>谷芯科技</strong>
          <small>食品安全快检配套服务</small>
        </span>
      </a>
      <nav>
        <a v-for="[label, href] in navItems" :key="label" :href="href">{{ label }}</a>
      </nav>
      <a class="header-phone" :href="`tel:${settings.contact_phone}`">{{ settings.contact_phone }}</a>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">山西谷芯科技有限公司</span>
          <h1>{{ heroTitle }}</h1>
          <p>{{ heroSubtitle }}</p>
          <div class="hero-actions">
            <a class="primary-btn" href="#contact">{{ settings.primary_button_text || '获取配置方案' }}</a>
            <a class="secondary-btn" href="#services">{{ settings.secondary_button_text || '查看服务能力' }}</a>
          </div>
          <div class="hero-badges">
            <span>快检室建设</span>
            <span>设备耗材配套</span>
            <span>合格证打印</span>
            <span>扫码查询</span>
          </div>
        </div>
        <div class="hero-board">
          <div class="board-title">
            <span>项目闭环能力</span>
            <strong>从配置到运行，一套流程落地</strong>
          </div>
          <div class="board-flow">
            <span>设备</span>
            <i></i>
            <span>检测</span>
            <i></i>
            <span>开证</span>
            <i></i>
            <span>查询</span>
          </div>
          <div class="board-metrics">
            <div><strong>6类</strong><span>典型应用场景</span></div>
            <div><strong>3档</strong><span>配置方案建议</span></div>
            <div><strong>1套</strong><span>快检云管理闭环</span></div>
          </div>
        </div>
      </section>

      <section class="section punch-section">
        <div>
          <span class="eyebrow">为什么要找谷芯科技</span>
          <h2>不是只买一台仪器，而是把快检室真正跑起来</h2>
        </div>
        <p>
          {{ settings.company_intro }}
          我们更关注客户能不能上手、记录能不能留住、合格证能不能顺畅开具、后续耗材和使用问题能不能有人对接。
        </p>
      </section>

      <section class="section capability-grid">
        <article v-for="item in capabilityCards" :key="item.title" class="capability-card">
          <span></span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </section>

      <section id="solutions" class="section">
        <div class="section-head wide">
          <span class="eyebrow">Solutions</span>
          <h2>按行业场景做快检室方案，而不是堆设备清单</h2>
          <p>不同客户真正需要的不一样：有的重检测，有的重开证，有的重资料留存，有的重现场培训。官网先展示方向，具体配置按项目沟通。</p>
        </div>
        <div class="solution-grid">
          <article v-for="item in scenarioCards" :key="item.title" class="solution-card">
            <h3>{{ item.title }}</h3>
            <div>
              <b>客户痛点</b>
              <p>{{ item.pain }}</p>
            </div>
            <div>
              <b>配套建议</b>
              <p>{{ item.solution }}</p>
            </div>
            <a href="#contact">咨询这个场景</a>
          </article>
        </div>
      </section>

      <section id="services" class="section service-section">
        <div class="section-head">
          <span class="eyebrow">Products & Services</span>
          <h2>设备、耗材、打印、数据平台，一起考虑才省心</h2>
          <p>第一版官网不堆大量型号，重点展示服务范围。具体型号、检测项目和数量，按客户现场需求确认。</p>
        </div>
        <div class="service-grid">
          <article v-for="[title, text] in serviceCards" :key="title" class="service-card">
            <div class="service-icon">{{ title.slice(0, 1) }}</div>
            <h3>{{ title }}</h3>
            <p>{{ text }}</p>
          </article>
        </div>
      </section>

      <section v-if="settings.show_cloud_module" id="cloud" class="section cloud-section">
        <div class="cloud-copy">
          <span class="eyebrow">Guxin Quick Test Cloud</span>
          <h2>谷芯快检云：把检测记录、开证、打印和扫码查询串起来</h2>
          <p>
            谷芯快检云面向食品安全快检场景，提供检测记录管理、合格证开具、公开扫码查询和模拟打印记录能力。
            当前真实检测仪器和真实打印机按项目需求进行对接与适配，不做过度承诺。
          </p>
          <ul>
            <li>检测记录留存</li>
            <li>承诺达标合格证开具</li>
            <li>扫码公开查询</li>
            <li>标签打印流程管理</li>
            <li>企业公开资料展示</li>
            <li>多企业账号管理</li>
          </ul>
        </div>
        <div class="cloud-card">
          <strong>检测 → 开证 → 打印 → 扫码</strong>
          <span>让客户从“有设备”升级到“有记录、有凭证、有查询入口”。</span>
        </div>
      </section>

      <section id="process" class="section process-section">
        <div class="section-head wide">
          <span class="eyebrow">Delivery Process</span>
          <h2>一套更适合项目落地的快检室建设流程</h2>
          <p>先判断场景，再给配置建议；先跑通流程，再做日常使用。减少客户买回去不会用、用不起来、资料留不住的问题。</p>
        </div>
        <div class="process-grid">
          <article v-for="[num, title, text] in processSteps" :key="num" class="process-card">
            <span>{{ num }}</span>
            <h3>{{ title }}</h3>
            <p>{{ text }}</p>
          </article>
        </div>
        <div class="package-grid">
          <article v-for="item in packageTypes" :key="item.title">
            <span>{{ item.tag }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </section>

      <section v-if="settings.show_materials" id="materials" class="section">
        <div class="section-head wide">
          <span class="eyebrow">Downloads</span>
          <h2>资料中心：方案、产品资料、操作说明统一沉淀</h2>
          <p>后台公开的资料会出现在这里。后续可逐步补充公司介绍、快检室方案、产品资料和操作说明。</p>
        </div>
        <div v-if="loading" class="empty-card">正在加载资料...</div>
        <div v-else-if="visibleMaterials.length" class="material-grid">
          <article v-for="item in visibleMaterials" :key="item.id" class="material-card">
            <span>{{ item.category || '资料' }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description || item.file_name }}</p>
            <small>{{ new Date(item.uploaded_at).toLocaleDateString('zh-CN') }}</small>
            <a :href="item.file_url" target="_blank" rel="noopener noreferrer">查看 / 下载</a>
          </article>
        </div>
        <div v-else class="empty-card">
          资料中心正在整理中，如需快检室配置建议、设备耗材清单或谷芯快检云演示，请电话联系谷芯科技。
        </div>
      </section>

      <section v-if="recommendedMaterials.length" class="section featured-materials">
        <div class="section-head compact-head">
          <h2>推荐资料</h2>
          <p>后台标记“推荐到首页”的资料会优先展示。</p>
        </div>
        <div class="material-row">
          <a v-for="item in recommendedMaterials" :key="item.id" :href="item.file_url" target="_blank" rel="noopener noreferrer">
            {{ item.title }}
          </a>
        </div>
      </section>

      <section id="contact" class="section contact-section">
        <div>
          <span class="eyebrow">Contact</span>
          <h2>把你的使用场景发过来，我们先帮你判断配置方向</h2>
          <p>适合咨询：快检室建设、检测仪器、试剂耗材、合格证打印、谷芯快检云、现有快检室升级。</p>
        </div>
        <div class="contact-card">
          <strong>山西谷芯科技有限公司</strong>
          <a :href="`tel:${settings.contact_phone}`">{{ settings.contact_phone }}</a>
          <span>{{ settings.wechat_tip }}</span>
          <small>服务范围：山西及周边可根据项目情况协商上门服务，省外可远程指导或沟通服务方式。</small>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <span>© 山西谷芯科技有限公司</span>
      <span>食品安全快检室整体配套服务</span>
      <span>备案号待完善</span>
    </footer>
  </div>
</template>
