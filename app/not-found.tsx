import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page">
      <h1>找不到這個頁面</h1>
      <p className="muted">請確認連結，或回首頁輸入活動代碼。</p>
      <Link className="primary" href="/">
        返回首頁
      </Link>
    </div>
  );
}
