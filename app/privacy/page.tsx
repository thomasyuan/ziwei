
import SectionHead from '@/components/SectionHead';
export const metadata = {
  title: '隐私政策 · 紫微斗数排盘与研究',
  description: '本站隐私政策：排盘数据只在起盘时使用，出生资料不存储于服务端；AI 追问会把命盘摘要送到所配置的大模型接口。',
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

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>1. 排盘数据</h2>
        <p style={{ fontSize: 13 }}>
          出生年、月、日、时辰、性别与出生地经度用于起盘与真太阳时校正。起盘在浏览器与服务端内存中完成，
          <strong>不写入数据库、不保存个人档案</strong>；页面刷新后数据即消失。分享链接（<code>/chart?y=…&amp;m=…</code>）
          把出生资料编码在 URL 中，由你自己决定是否分享。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>2. 规则解读</h2>
        <p style={{ fontSize: 13 }}>
          十三维解读由服务端论断引擎按命盘生成（不经 AI），请求体是本页起出的命盘 JSON，服务端只处理不落盘。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>3. AI 追问</h2>
        <p style={{ fontSize: 13 }}>
          使用 AI 追问时，服务端会把「命盘摘要 + 当前主题的规则解读 + 你的提问」发送到所配置的模型接口
          （由部署者配置的 AI_API_KEY / AI_BASE_URL 决定，例如 DeepSeek 或 OpenAI 兼容服务）。
          若你不想把出生资料送到第三方，请不要使用 AI 面板；规则解读与排盘功能不受影响。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>4. 分析型工具</h2>
        <p style={{ fontSize: 13 }}>
          若部署时启用访问统计（如 Vercel Analytics / Speed Insights），采集的是页面性能与访问概览，
          不采集出生资料。表单内容不会作为事件上报。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>5. 数据保存与删除</h2>
        <p style={{ fontSize: 13 }}>
          本站无账号系统，没有可删除的账号数据。若你使用分享链接，链接中的出生资料在浏览器与服务器日志里可能留存，
          请自行评估是否公开；日志的留存期取决于部署平台。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>6. 免责</h2>
        <p style={{ fontSize: 13 }}>
          本站内容为传统术数的学习与文化研究，不构成医疗、法律、投资与人生重大决策建议。
          紫微斗数论六亲（父母、兄弟、子女）历来是弱项，相关维度仅供参考。
        </p>

        <div className="card p-5" style={{ marginTop: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '8px' }}>第三方接口清单</div>
          <p style={{ fontSize: 12, color: 'var(--tx-2)' }}>
            排盘与解读只依赖本地开源库（iztro、lunar-javascript）。唯一的对外调用是 AI 追问所用的模型接口，
            由部署者自行配置，发送内容如上第 3 条所述。
          </p>
        </div>
      </main>
    </>
  );
}
