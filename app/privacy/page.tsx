
import SectionHead from '@/components/SectionHead';
export const metadata = {
  title: '隐私政策 · 紫微斗数排盘与研究',
  description: '本站隐私政策：排盘与 13 维解读在浏览器内完成，出生资料不入库；AI Key 存在你自己的浏览器，请求由浏览器直连厂商接口，本站不收 Key、不留日志。',
};

export default function PrivacyPage() {
  return (
    <>
      <main className="mx-auto max-w-[820px] px-4 sm:px-6 pt-0 pb-16" style={{ color: 'var(--tx-1)', lineHeight: 1.85 }}>
        <SectionHead
          eyebrow="PRIVACY POLICY"
          title="隐私政策"
          desc="生效日期：部署当日。本站无账号体系，排盘数据不入库。"
          topPad={46}
        />

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>1. 排盘与规则解读</h2>
        <p style={{ fontSize: 13 }}>
          出生年、月、日、时辰、性别与出生地经度用于起盘与真太阳时校正。起盘与 13 维规则解读（论断库、格局识别、
          合盘评分）**全在浏览器里完成**，论断库与排盘引擎都是纯函数，不请求本站服务器；页面刷新后数据即消失。
          分享链接（<code>/chart?y=…&amp;m=…</code>）把出生资料编码在 URL 中，由你自己决定是否分享。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>2. AI Key 存在哪里</h2>
        <p style={{ fontSize: 13 }}>
          排盘页 / 合盘页的「设置 Key」面板把 Key 写进<strong>你自己浏览器的</strong> <code>localStorage</code>
          （勾选「记住」，跨会话保留）或 <code>sessionStorage</code>（不勾，关掉标签页即失效），
          本页的 <code>ziwei-ai-settings</code> 一条就是全部存放位置。本站是静态站点（GitHub Pages 只发 HTML/JS），
          <strong>没有后端收 Key，也就没有服务端存储与服务端日志可写 Key</strong>；「清除」按钮两份存储一起删。
        </p>
        <p style={{ fontSize: 13, marginTop: '8px' }}>
          要点：浏览器存储是<strong>明文</strong>。共用电脑上登录你账号的人、以及装有「读取站点存储」权限的浏览器扩展，
          都能读到它；所以这条路径只建议在你自己的设备上开。要更保守就用 sessionStorage（关掉标签页即失效），
          用完点「清除 Key」。全站代码不打印 Key，错误提示只给状态码与厂商自己的文案，不回显 Key。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>3. AI 追问与合盘深挖</h2>
        <p style={{ fontSize: 13 }}>
          使用 AI 时，<strong>浏览器直接</strong>把「命盘摘要 + 当前主题的规则解读 + 你的提问」发到你所选厂商的
          OpenAI 兼容接口（DeepSeek / OpenAI / Moonshot / 通义），随请求带 <code>Authorization: Bearer &lt;Key&gt;</code>。
          这条请求不经过本站服务器，本站看不到内容也看不到 Key。厂商一侧按其隐私政策处理你的提问文本，
          花费记在你自己的厂商账号。面板里的「拉取模型列表 / 测试连接」会额外发一条
          <code>GET /models</code>：只带 Key，<strong>不带</strong>命盘与提问，用来把模型名做成下拉。
          若你不想把出生资料送到第三方，就不要使用 AI 面板；
          排盘、13 维规则解读与合盘评分不需要 Key，完全可用。
        </p>
        <p style={{ fontSize: 13, marginTop: '8px' }}>
          智谱（open.bigmodel.cn）实测不允许浏览器跨域直连（CORS 预检不返回跨域许可），这一家需要自建允许跨域的中转；
          面板里选中它会明确提示，不让你反复重试。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>4. 分析型工具</h2>
        <p style={{ fontSize: 13 }}>
          部署时启用的访问统计（Vercel Analytics / Speed Insights）采集的是页面性能与访问概览，
          <strong>不采集表单内容，也不采集 AI 请求</strong>：Key 与提问文本都在浏览器到厂商的直连通道里，
          统计脚本看不到。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>5. 数据保存与删除</h2>
        <p style={{ fontSize: 13 }}>
          本站无账号系统，没有可删除的账号数据。浏览器里的 Key 用页面上的「清除 Key」即刻删除；
          排盘历史（<code>ziwei_history</code>）与主题选择（<code>ziwei-theme</code>）同样只在本浏览器里，
          清站点数据即消失。若你使用分享链接，链接中的出生资料在浏览器与部署平台的访问日志里可能留存，
          请自行评估是否公开；日志的留存期取决于部署平台（GitHub Pages 的访问日志由 GitHub 保留）。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>6. 免责</h2>
        <p style={{ fontSize: 13 }}>
          本站内容为传统术数的学习与文化研究，不构成医疗、法律、投资与人生重大决策建议。
          紫微斗数论六亲（父母、兄弟、子女）历来是弱项，相关维度仅供参考。
        </p>

        <div className="card p-5" style={{ marginTop: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '8px' }}>第三方接口清单</div>
          <p style={{ fontSize: 12, color: 'var(--tx-2)' }}>
            排盘与解读只依赖本地开源库（iztro、lunar-javascript），全部在浏览器里跑。唯一的对外调用是
            AI 追问所用的模型接口，由<strong>使用者自己的 Key</strong>（存在本浏览器）在浏览器里直发厂商，
            发送内容如上第 3 条所述；本站不经手，也没有服务端日志可记录它。
          </p>
        </div>
      </main>
    </>
  );
}
