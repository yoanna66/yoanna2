import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  Link2,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  Check,
  Hash,
} from "lucide-react";
import { Join } from "@/components/join";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="eyebrow">
              <span className="dot" /> LET’S MAKE TIME
            </div>
            <h1>
              別再問「哪天有空？」
              <br />
              一起，<span>揪個好時間。</span>
            </h1>
            <p className="lead">
              聚餐、討論，或一場期待已久的見面。
              <br />
              把連結傳給大家，輕鬆找到剛剛好的共同時間。
            </p>
            <Link className="primary" href="/create">
              建立一個活動 <ArrowRight size={18} />
            </Link>
            <div className="trust">
              <ShieldCheck size={14} />
              免費使用 <span>・</span> 不用註冊 <span>・</span> 分享即加入
            </div>
          </div>
          <div className="illustration" aria-hidden="true">
            <div className="calendar-art">
              <div className="art-top">
                <strong>讓相聚，發生。</strong>
                <span>找到大家的交集 ↗</span>
              </div>
              <div className="art-grid">
                {"一二三四五六日".split("").map((d) => (
                  <b key={d}>{d}</b>
                ))}
                {Array.from({ length: 28 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i === 17
                        ? "best"
                        : [9, 10, 16, 18, 24].includes(i)
                          ? "chosen"
                          : ""
                    }
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
              <div className="art-bottom">
                <div className="avatars">
                  <i>你</i>
                  <i>我</i>
                  <i>他</i>
                </div>
                <span>每個人的時間，都值得被看見</span>
              </div>
            </div>
            <div className="float-label">
              <Check size={25} />
              <div>
                <strong>找到共同的空檔</strong>
                <small>把時間留給重要的人</small>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="join-wrap">
        <div className="join">
          <div className="join-title">
            <span className="soft-icon">
              <Hash size={22} />
            </span>
            <div>
              <h2>已經收到活動代碼？</h2>
              <p>輸入代碼，告訴大家你什麼時候有空。</p>
            </div>
          </div>
          <Join />
        </div>
      </section>
      <section id="how" className="how">
        <div className="section-heading">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>三個小步驟，讓相聚更簡單</h2>
          <p>不用下載 App，也不用在群組裡來回翻訊息。</p>
        </div>
        <div className="steps">
          {[
            {
              icon: CalendarPlus,
              title: "建立活動，選幾個時間",
              text: "不管是週末聚餐還是小組討論，先給活動一個名字，放上候選時段。",
            },
            {
              icon: Link2,
              title: "分享連結，揪大家填寫",
              text: "傳送邀請連結或 QR Code，朋友輸入暱稱，就能勾選有空的時間。",
            },
            {
              icon: ChartNoAxesColumnIncreasing,
              title: "看看交集，決定見面時間",
              text: "每個時段有多少人能來，一眼就知道。由發起人確認，準備好相聚。",
            },
          ].map((s, i) => (
            <article className="step" key={s.title}>
              <span className="step-num">0{i + 1}</span>
              <span className="soft-icon">
                <s.icon size={22} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="bottom-note">
        朋友聚餐 / 分組討論 / 社團活動 /
        工作會議　—　每一次相聚，都從一個好時間開始。
      </div>
    </>
  );
}
