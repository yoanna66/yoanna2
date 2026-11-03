"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
export function Join() {
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <form
      className="join-controls"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/events/${code.trim().toUpperCase()}/respond`);
      }}
    >
      <input
        aria-label="活動代碼"
        required
        pattern="[a-fA-F0-9]{12}"
        maxLength={12}
        placeholder="輸入 12 碼活動代碼"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        title="請輸入 12 碼英數活動代碼"
      />
      <button className="secondary">
        加入活動 <ArrowRight size={16} />
      </button>
    </form>
  );
}
