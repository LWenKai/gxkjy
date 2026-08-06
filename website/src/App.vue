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
  ['首页', '#top'],
  ['关于我们', '#about'],
  ['产品中心', '#products'],
  ['解决方案', '#solutions'],
  ['谷芯快检云', '#cloud'],
  ['服务项目', '#services'],
  ['新闻动态', '#news'],
  ['联系我们', '#contact'],
];

const stats = [
  { num: '2007', label: '团队深耕快检领域' },
  { num: '6+', label: '典型服务行业' },
  { num: '3档', label: '标准化配置方案' },
  { num: '1套', label: '快检云管理闭环' },
];

const businessBlocks = [
  {
    title: '科学仪器与样品前处理',
    text: '提供智能化的实验室基础装备与前处理工具，提升检测效率与操作规范。',
  },
  {
    title: '食品快检设备与试剂耗材',
    text: '涵盖农残、兽残等快检设备、胶体金检测卡与试剂，满足基层筛查需求。',
  },
  {
    title: '合格证打印与信息化',
    text: '标签打印、二维码查询与谷芯快检云协同，赋能快检数字化管理。',
  },
  {
    title: '第三方检测与外包服务',
    text: '依托专业资质与项目经验，为社会提供权威、规范的检测支撑。',
  },
];

const productGroups = [
  {
    title: '食品安全检测仪',
    items: ['多功能光谱检测仪', '农药残留快速检测仪', '胶体金读卡仪', '劣质油检测仪'],
  },
  {
    title: '试剂与耗材',
    items: ['农残酶法试剂', '胶体金检测卡', '样品前处理工具', '日常耗材补给'],
  },
  {
    title: '合格证与打印',
    items: ['合格证智能机', '标签打印机', '60×80mm 合格证纸', '二维码查询贴'],
  },
  {
    title: '软件与信息化',
    items: ['谷芯快检云', '检测记录管理', '企业资料展示', '扫码公开查询'],
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
  ['快检室建设', '按场地条件输出设备、耗材、打印、数据平台和配套工具建议。'],
  ['第三方检测对接', '协助对接专业检测资源，形成权威检测支撑。'],
  ['快检外包服务', '为不具备自检条件的客户提供检测与开证外包支持。'],
  ['安装与培训', '山西省内可上门安装指导、账号配置和操作培训。'],
  ['售后与补给', '远程技术支持、耗材补给提醒与设备使用答疑。'],
  ['资料与合规', '检测记录、合格证、公开查询入口统一管理，便于验收与检查。'],
];

const newsList = [
  {
    tag: '企业动态',
    date: '2026-07-27',
    title: '谷芯快检云上线扫码公开查询，合格证状态一键可查',
    desc: '采购方、消费者与监管人员扫码即可确认合格证有效性、查看产品承诺信息与检测依据。',
  },
  {
    tag: '食安科普',
    date: '2026-07-20',
    title: '夏季凉拌菜风险提醒：农残与微生物双把关',
    desc: '高温季节微生物繁殖快，建议出库前完成快检并留存记录，降低食安风险。',
  },
  {
    tag: '产品专题',
    date: '2026-07-10',
    title: '合格证智能机 + 标签打印：让开证从手动变流畅',
    desc: '从检测记录到标签打印再到扫码查询，形成可追溯的合格证闭环。',
  },
  {
    tag: '行业资讯',
    date: '2026-06-30',
    title: '幼儿园食品安全新规落地，台账与留样更受关注',
    desc: '新规强调主体责任，快检记录与合格证留存成为食堂日常管理的基础动作。',
  },
];

const guarantees = [
  {
    title: '现场安装与培训',
    text: '山西省内可根据项目情况提供上门安装指导、账号配置和操作培训，让客户真正用起来。',
  },
  {
    title: '耗材持续补给',
    text: '按检测项目和使用频次提醒试剂耗材补给，避免设备到位后“无米下锅”。',
  },
  {
    title: '远程技术支持',
    text: '使用答疑、数据对接、打印适配等问题可通过微信/电话远程沟通，减少停机等待。',
  },
  {
    title: '资料合规留存',
    text: '检测记录、合格证、公开查询入口统一管理，便于客户验收、监管检查和企业自证。',
  },
];

const processSteps = [
  ['01', '需求判断', '确认客户场景、检测项目、日均检测量和开证需求。'],
  ['02', '配置清单', '输出设备、耗材、打印、数据平台和配套工具建议。'],
  ['03', '现场落地', '按场地条件安排安装指导、账号配置和操作培训。'],
  ['04', '试运行', '用真实样品流程跑通检测、开证、打印和扫码查询。'],
  ['05', '资料留存', '形成日常检测记录、合格证记录和公开查询资料。'],
  ['06', '后续支持', '提供耗材补给、使用答疑和后续设备数据适配沟通。'],
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
        <img class="brand-logo" src="./assets/logo-icon.png" alt="谷芯科技" />
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
      <!-- 首屏 -->
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">山西谷芯科技有限公司</span>
          <h1>食品安全快检室<br />整体解决方案服务商</h1>
          <p>
            围绕检测仪器、试剂耗材、合格证打印与谷芯快检云，为合作社、配送企业、学校食堂和加工企业提供从配置到落地的快检室配套服务。
          </p>
          <div class="hero-actions">
            <a class="primary-btn" href="#contact">{{ settings.primary_button_text || '获取配置方案' }}</a>
            <a class="secondary-btn" href="#products">{{ settings.secondary_button_text || '查看产品中心' }}</a>
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
            <div v-for="item in stats" :key="item.label">
              <strong>{{ item.num }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 关于我们 -->
      <section id="about" class="section about-section">
        <div class="about-grid">
          <div class="about-intro">
            <span class="eyebrow">关于我们</span>
            <h2>不只是卖设备，更帮客户把快检室真正跑起来</h2>
            <p>
              {{ settings.company_intro }}
              我们更关注客户能不能上手、记录能不能留住、合格证能不能顺畅开具、后续耗材和使用问题能不能有人对接。
            </p>
            <div class="about-meta">
              <div><strong>山西谷芯科技有限公司</strong><span>主体运营单位</span></div>
              <div><strong>谷芯快检云</strong><span>自有 SaaS 管理平台</span></div>
            </div>
          </div>
          <div class="about-stats">
            <div v-for="item in stats" :key="item.label" class="about-stat">
              <strong>{{ item.num }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 主营业务 -->
      <section class="section punch-section">
        <div>
          <span class="eyebrow">主营业务</span>
          <h2>四大业务方向，覆盖快检室日常运行的每个环节</h2>
        </div>
        <p>
          从场地配置、设备耗材、合格证开具到数据留存，谷芯科技提供的是一套可落地的整体配套，而不是单点产品。
        </p>
      </section>

      <section class="section business-grid">
        <article v-for="item in businessBlocks" :key="item.title" class="business-card">
          <span class="business-dot"></span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </section>

      <!-- 产品中心 -->
      <section id="products" class="section">
        <div class="section-head wide">
          <span class="eyebrow">产品中心</span>
          <h2>检测仪器、试剂耗材、打印与软件，分类清晰可查</h2>
          <p>第一版官网不堆大量型号，重点展示产品范围。具体型号、检测项目和数量，按客户现场需求确认。</p>
        </div>
        <div class="product-grid">
          <article v-for="group in productGroups" :key="group.title" class="product-card">
            <h3>{{ group.title }}</h3>
            <ul>
              <li v-for="it in group.items" :key="it">{{ it }}</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- 解决方案 -->
      <section id="solutions" class="section">
        <div class="section-head wide">
          <span class="eyebrow">行业解决方案</span>
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

      <!-- 谷芯快检云 -->
      <section v-if="settings.show_cloud_module" id="cloud" class="section cloud-section">
        <div class="cloud-copy">
          <span class="eyebrow">谷芯快检云</span>
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

      <!-- 服务项目 -->
      <section id="services" class="section service-section">
        <div class="section-head">
          <span class="eyebrow">服务项目</span>
          <h2>设备、耗材、打印、数据平台，一起考虑才省心</h2>
          <p>从建设到运维，谷芯科技把安装、培训、检测对接与远程支持作为标准服务的一部分。</p>
        </div>
        <div class="service-grid">
          <article v-for="[title, text] in serviceCards" :key="title" class="service-card">
            <div class="service-icon">{{ title.slice(0, 1) }}</div>
            <h3>{{ title }}</h3>
            <p>{{ text }}</p>
          </article>
        </div>
      </section>

      <!-- 新闻动态 -->
      <section id="news" class="section news-section">
        <div class="section-head wide">
          <span class="eyebrow">新闻动态</span>
          <h2>企业动态、食安科普与产品专题</h2>
          <p>跟踪谷芯快检云进展、行业法规变化与实用科普，帮助客户用好快检、管好食安。</p>
        </div>
        <div class="news-grid">
          <article v-for="item in newsList" :key="item.title" class="news-card">
            <div class="news-top">
              <span class="news-tag">{{ item.tag }}</span>
              <span class="news-date">{{ item.date }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <a href="#contact">阅读更多</a>
          </article>
        </div>
      </section>

      <!-- 服务保障 -->
      <section class="section guarantee-section">
        <div class="section-head wide">
          <span class="eyebrow">服务保障</span>
          <h2>买回去能用、用起来有人管，才是真的配套服务</h2>
          <p>谷芯科技把安装、培训、耗材补给和远程支持作为标准服务的一部分，降低客户的使用门槛和运维风险。</p>
        </div>
        <div class="guarantee-grid">
          <article v-for="item in guarantees" :key="item.title" class="guarantee-card">
            <span class="guarantee-dot"></span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </section>

      <!-- 资料中心 -->
      <section v-if="settings.show_materials" id="materials" class="section">
        <div class="section-head wide">
          <span class="eyebrow">资料中心</span>
          <h2>方案、产品资料、操作说明统一沉淀</h2>
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

      <!-- 联系我们 -->
      <section id="contact" class="section contact-section">
        <div>
          <span class="eyebrow">联系我们</span>
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
      <div class="footer-main">
        <div class="footer-brand">
          <img class="footer-logo" src="./assets/logo-icon.png" alt="谷芯科技" />
          <div>
            <strong>山西谷芯科技有限公司</strong>
            <span>食品安全快检室整体配套服务</span>
          </div>
        </div>
        <div class="footer-cols">
          <div>
            <b>产品中心</b>
            <a href="#products">检测仪器</a>
            <a href="#products">试剂耗材</a>
            <a href="#products">合格证打印</a>
            <a href="#cloud">谷芯快检云</a>
          </div>
          <div>
            <b>解决方案</b>
            <a href="#solutions">合作社 / 基地</a>
            <a href="#solutions">配送企业</a>
            <a href="#solutions">学校食堂</a>
            <a href="#solutions">加工企业</a>
          </div>
          <div>
            <b>联系</b>
            <a :href="`tel:${settings.contact_phone}`">{{ settings.contact_phone }}</a>
            <a href="#contact">获取方案</a>
            <a href="#about">关于我们</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} 山西谷芯科技有限公司</span>
        <span>食品安全快检室整体配套服务</span>
        <span>备案号待完善</span>
      </div>
    </footer>
  </div>
</template>
