import nightHeroVisual from '../../../assets/tdeetracer-key-visual-night-v1.png'
import heroVisual from '../../../assets/tdeetracer-key-visual-v5-petite-fox-mage.png'
import { useEffect } from 'react'
import { DataFooter } from '../../components/DataFooter'
import type { WorkMode } from '../../domain/types'
import { useCurrentTheme } from '../theme/ThemeContext'

interface HomePageProps {
  onChoose: (mode: WorkMode) => void
}

export function HomePage({ onChoose }: HomePageProps) {
  const theme = useCurrentTheme()

  useEffect(() => {
    const alternateHero = new Image()
    alternateHero.src = theme === 'dark' ? heroVisual : nightHeroVisual
  }, [theme])

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero-image"
          src={theme === 'dark' ? nightHeroVisual : heroVisual}
          alt=""
          aria-hidden="true"
        />
        <div className="home-hero-scrim" aria-hidden="true" />
        <div className="home-hero-content">
          <div className="home-hero-copy">
            <p className="home-hero-kicker">從 TDEE 出發，記下每一步</p>
            <h1 id="home-title" aria-label="讓改變留下軌跡，同你行至彼方">
              <span aria-hidden="true">讓改變留下軌跡</span>
              <span aria-hidden="true">同你行至彼方</span>
            </h1>
            <button
              className="primary-button home-primary-action"
              type="button"
              onClick={() => onChoose('quick')}
            >
              開始快速估算
              <span aria-hidden="true">→</span>
            </button>
            <div className="home-trust-note">
              <span aria-hidden="true" />
              不需帳號，資料只保留在目前裝置
            </div>
          </div>
        </div>
        <button
          className="home-scroll-cue"
          type="button"
          aria-label="向下查看旅程路徑"
          onClick={() =>
            document
              .getElementById('home-journey')
              ?.scrollIntoView({ block: 'start' })
          }
        >
          <span className="home-scroll-cue-mark" aria-hidden="true" />
        </button>
      </section>

      <section
        id="home-journey"
        className="home-journey"
        aria-labelledby="home-path-title"
      >
        <div className="home-journey-content">
          <div className="home-path-intro">
            <div className="home-path-heading">
              <p>一條路徑，兩個階段</p>
              <h2 id="home-path-title">先建立方向，再讓真實紀錄修正預測</h2>
            </div>

            <ol className="home-path-steps">
              <li>
                <span className="home-step-node">01</span>
                <div>
                  <strong>建立起點</strong>
                  <p>輸入身體條件與活動量，取得個人化 TDEE 估算。</p>
                </div>
              </li>
              <li>
                <span className="home-step-node">02</span>
                <div>
                  <strong>選擇步伐</strong>
                  <p>比較攝取量或固定赤字策略，理解時間與安全範圍。</p>
                </div>
              </li>
              <li>
                <span className="home-step-node">03</span>
                <div>
                  <strong>持續校準</strong>
                  <p>以飲食、運動與實際體重更新未來路徑，不被單日波動定義。</p>
                </div>
              </li>
            </ol>
          </div>

          <section className="home-returning" aria-label="既有計畫">
            <div>
              <strong>已經有正式計畫？</strong>
              <span>回到日誌，記下今天並查看最新趨勢。</span>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onChoose('diary')}
            >
              開始記錄
              <span aria-hidden="true">→</span>
            </button>
          </section>
        </div>
        <DataFooter />
      </section>
    </main>
  )
}
