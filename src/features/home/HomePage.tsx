import type { WorkMode } from '../../domain/types'

interface HomePageProps {
  onChoose: (mode: WorkMode) => void
}

export function HomePage({ onChoose }: HomePageProps) {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="eyebrow">TDEE Weight Planner</span>
          <h1>看見每一步的改變</h1>
        </div>
      </section>

      <section className="mode-choice" aria-label="選擇計算方式">
        <button
          className="choice-card quick-choice"
          type="button"
          onClick={() => onChoose('quick')}
        >
          <span className="choice-number">01</span>
          <span className="eyebrow">Quick calculation</span>
          <strong>快速計算</strong>
          <span>
            填寫身體資料、活動量與熱量策略，立即查看 TDEE、達標日期與每月變化。
          </span>
          <b>開始快速估算 →</b>
        </button>

        <button
          className="choice-card diary-choice"
          type="button"
          onClick={() => onChoose('diary')}
        >
          <span className="choice-number">02</span>
          <span className="eyebrow">Detailed calculation</span>
          <strong>精細計算</strong>
          <span>
            記下每日飲食與運動，讓圖表隨真實紀錄更新，並累積簽到成就。
          </span>
          <b>開始記錄 →</b>
        </button>
      </section>
    </main>
  )
}
