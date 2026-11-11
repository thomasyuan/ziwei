
import SectionHead from '@/components/SectionHead';
export const metadata = {
  title: '服务条款 · 紫微斗数排盘与研究',
  description: '本站服务条款：内容授权、使用边界、免责与开源许可（排盘引擎 MIT、论断内容 CC BY 4.0、古籍公版）。',
};

export default function TermsPage() {
  return (
    <>
      <main className="mx-auto max-w-[820px] px-4 sm:px-6 pt-0 pb-16" style={{ color: 'var(--tx-1)', lineHeight: 1.85 }}>
        <SectionHead
          eyebrow="TERMS OF SERVICE"
          title="服务条款"
          desc="生效日期：部署当日。服务内容、使用边界与授权见下文。"
          topPad={46}
        />

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>1. 服务内容</h2>
        <p style={{ fontSize: 13 }}>
          本站提供紫微斗数排盘、十三维规则解读、格局识别、古籍原文阅读、知识库与合盘分析，
          以及可选的大模型追问。所有内容为传统术数的学习与文化研究，
          <strong>不构成医疗、投资、法律、心理咨询或人生重大决策建议</strong>。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>2. 使用边界</h2>
        <ul style={{ paddingLeft: 22, fontSize: 13 }}>
          <li>不以本站内容作为医疗、法律与投资行为的唯一依据</li>
          <li>不利用本站输出对他人进行操控性、恐吓性的论断（尤其涉及六亲与寿命）</li>
          <li>不批量爬取知识库页面用于二次商业训练</li>
          <li>AI 面板输出的内容是模型生成，本站不对其准确性负责</li>
        </ul>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>3. 内容授权</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: 'var(--tx-3)' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--bdr)' }}>部分</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--bdr)' }}>授权</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--bdr)' }}>可以做什么</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--tx-2)' }}>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>排盘引擎与界面代码</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>MIT</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>自由使用与二次开发，保留 LICENSE</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>论断内容（本站原创编纂）</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>CC BY 4.0</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>商用需注明本站为来源</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>古籍原文（《全书》《全集》《骨髓赋》）</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>公版</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>任意引用与传播</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>安星算法实现</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>iztro（MIT）</td>
              <td style={{ padding: '8px', borderBottom: '1px solid var(--bdr)' }}>遵循上游许可</td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>4. 无账号、无收费</h2>
        <p style={{ fontSize: 13 }}>
          本站不设注册、会员与支付体系，也不出售解读服务，也不代收任何模型接口费用：
          AI 追问用的是访问者自己的 Key（存在其浏览器，由浏览器直连厂商接口），
          费用由访问者与厂商之间结算，与本站无关。排盘与规则解读不需要 Key，始终免费可用。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>5. 免责</h2>
        <p style={{ fontSize: 13 }}>
          命盘输出依赖出生资料的准确性；时辰不详、出生地经度缺失或钟表时间异常（夏令时、时区变更）都会改变结果。
          紫微斗数论六亲历来偏弱，父母、兄弟、子女三个维度的内容仅供参考。本站不对任何因使用内容而产生的决定与后果负责。
        </p>

        <h2 style={{ fontSize: 17, marginTop: 26, marginBottom: 10 }}>6. 内容更正</h2>
        <p style={{ fontSize: 13 }}>
          发现断语与古籍原文不符、格局条件写错、四化表越界（例如出现「紫微化忌」「七杀化权」），
          欢迎指出并附盘例（年月日时 + 性别 + 具体哪一条），我们会核对修正。
        </p>
      </main>
    </>
  );
}
