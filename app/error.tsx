"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page">
      <h1>暫時無法載入頁面</h1>
      <p className="muted">請稍後重試。已儲存的活動不會因重新載入而消失。</p>
      <button className="primary" onClick={reset}>
        再試一次
      </button>
    </div>
  );
}
