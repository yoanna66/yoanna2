# 揪時間：系統流程、程式架構與部署連接

共 16 頁，建議報告時間 10–15 分鐘。含可編輯 PowerPoint、PDF 及逐頁講稿。

下載：在 GitHub 開啟 PPTX 或 PDF 後，點 Download raw file（下載原始檔案）。GitHub 可直接閱讀下方講稿。

## 01｜揪時間

把時間留給相聚

- **開放式多人時間協調平台**：朋友聚餐、學生討論、社團活動與工作會議，都能找到共同時間。
- **網站與技術**：繁體中文、手機優先；Next.js、TypeScript、Tailwind CSS、Supabase。

**講稿：** 今天介紹網站的使用流程、程式架構，以及 GitHub、Vercel 和 Supabase 之間如何連接。

## 02｜為什麼需要揪時間？

把群組裡的來回詢問，變成清楚的統計

- **常見問題**：訊息容易被淹沒，每個人的時間分散在不同回覆，很難整理。
- **不限定固定群組**：每次聚會皆可建立獨立活動，分享連結即可加入。
- **不用註冊帳號**：暱稱加上可參加的時段，降低參與門檻。
- **由發起人做決定**：統計協助找出交集，再由發起人確認最終時間。

**講稿：** 平台解決的是協調時間的成本。它不會自動替所有人做決定，也不把暱稱當成真實身分證明。

## 03｜整體使用流程

建立 → 邀請 → 填答 → 統計 → 確認

- **01 建立活動**：輸入活動名稱、發起人暱稱，設定多個候選日期與時間。
- **02 邀請朋友**：分享公開邀請連結、QR Code，或讓朋友輸入 12 碼活動代碼。
- **03 填寫與修改**：暱稱與複選時段；提交後保存私人修改連結。
- **04 統計與確認**：查看人數與最佳時段，由管理連結持有者確認最終時間。

**講稿：** 不同使用者可持續建立活動。每個活動有獨立代碼，答案各自保存，重新整理後仍從資料庫載入。

## 04｜五個主要頁面

Next.js App Router 路由規劃

- **首頁與建立活動**：/：介紹與代碼加入 /create：活動基本資料與候選時段。
- **邀請頁**：/events/[code]/invite 顯示活動代碼、邀請連結與 QR Code。
- **填寫頁**：/events/[code]/respond 填寫、載入與更新自己的答案。
- **結果頁**：/events/[code]/results 統計、參與紀錄與最終時間確認。

**講稿：** code 是活動的公開識別碼。相同元件會依不同 code 取得不同活動資料，不需要為每次聚會重寫網頁。

## 05｜操作細節：日期與回填

讓操作更順手，也減少重複輸入

- **日期與時間**：月曆點選日期；24 小時制，時與分等寬排列。以台灣時間 UTC+8 解讀。
- **候選時段規則**：1–40 個時段、允許跨日；結束須晚於開始，重複時段會被拒絕。
- **發起人暱稱**：新活動建立後，同一瀏覽器自動帶入發起人名稱，不影響其他參與者。
- **返回填寫頁**：瀏覽器記住該活動的修改憑證，重新載入原答案；更新不新增紀錄。

**講稿：** localStorage 只作便利記錄，答案的正式來源仍是 Supabase。換裝置、清除資料或阻擋儲存後，需用私人修改連結。共用電腦建議使用無痕模式。

## 06｜統計如何運作？

從真實答案計算，而非預先放置假資料

- **各時段可參加人數**：依資料庫答案計算人數及長條比例，可手動更新統計。
- **最佳時段**：最高人數的時段全部標示；並列最佳與全員可參加都有對應提示。
- **特殊情況**：支援零答案、全部沒空、沒有全員共同時段等狀態。
- **確認之後**：發起人確認最終時段後，停止新增或修改答案，且不可改選。

**講稿：** 免登入無法完全防止重複填寫，因此紀錄數不代表已認證的不重複人數。目前更新統計是重新向 API 讀取，不是 Realtime 推播。

## 07｜用到的程式與平台

前端、伺服器、資料庫與部署

- **Next.js／React／TypeScript**：Next.js 管理頁面和 API；React 組合介面；TypeScript 檢查型別。
- **Tailwind CSS 與工具套件**：響應式樣式；Zod 驗證輸入、qrcode.react 產生 QR Code、Lucide 提供圖示。
- **Supabase／PostgreSQL**：儲存活動、時段與答案，以 SQL 函式實作資料驗證和原子寫入。
- **GitHub／Vercel／Node.js**：GitHub 管版本，Vercel 建置與託管；Node.js 提供伺服器執行環境。

**講稿：** 程式曾透過 Codex 協助規劃、實作及測試。Vercel 雲端部署後，使用者不需要在個人電腦安裝 Node.js 就能操作網站。

## 08｜主要程式檔案對照

從畫面操作，找到負責的程式

- **建立活動與日期選擇**：app/create/page.tsx components/date-time-picker.tsx
- **邀請、填答與統計**：components/event-pages.tsx components/shared.tsx
- **伺服器 API 與資料連線**：app/api/events/route.ts app/api/events/[code]/route.ts lib/server.ts
- **資料庫與驗證邏輯**：supabase/migrations/001_initial.sql lib/domain.ts

**講稿：** 建立頁負責整理表單並呼叫 API。event-pages 組合邀請、填寫與統計介面；shared 負責共用 API 請求。server 模組只在伺服器讀取金鑰與連接 Supabase；domain 包含輸入 schema、時間格式及統計函式。

## 09｜資料如何流動？

瀏覽器 → Next.js API → Supabase → PostgreSQL

- **01 瀏覽器發送**：按提交後，fetch 將 JSON 傳到網站同來源的 /api/events 路徑。
- **02 伺服器檢查**：Zod 驗證輸入，SHA-256 處理私人憑證；從環境變數讀取 Secret key。
- **03 SDK 呼叫 RPC**：supabase-js 透過 HTTPS 呼叫 create_event、save_response 等資料庫函式。
- **04 資料庫回應**：SQL 函式驗證並讀寫資料，再逐層回傳成功、統計或錯誤訊息。

**講稿：** 瀏覽器不會取得 Supabase Secret key。伺服器 SDK 透過 PostgREST 的 RPC 介面存取資料庫，不需要向前端暴露資料庫連線字串。

## 10｜資料庫三張表

活動是所有資料關係的中心

- **events｜活動**：id、code、title、organizer、admin_hash、final_slot_id、created_at。
- **slots｜候選時段**：id、event_id、starts_at、ends_at。每個活動可有多個時段。
- **participants｜參與者**：event_id、nickname、edit_hash、choices、updated_at。choices 儲存時段 UUID 陣列。
- **一致性與競爭控制**：外鍵及 RPC 檢查時段歸屬；提交和確認鎖定活動列，避免寫入競爭。

**講稿：** 每個活動和修改憑證雜湊的組合唯一。同一憑證重試或更新只會修改原紀錄；不能選擇其他活動的時段。

## 11｜三種連結，三種用途

公開邀請與私人權限要分清楚

- **公開邀請連結**：/events/[code]/respond 可分享；QR Code 指向這個公開頁面。
- **私人修改連結**：/events/[code]/respond#edit=憑證 用來載入與修改對應的一筆答案。
- **私人管理連結**：/events/[code]/results#admin=憑證 持有者可確認最終時間，請勿公開。
- **憑證如何保護**：256-bit 隨機值；資料庫只存 SHA-256 雜湊，公開資料不含憑證或其雜湊。

**講稿：** fragment 不會自動隨頁面請求送到伺服器。需要驗證時才透過 HTTPS JSON 傳送憑證；請勿公開投影或分享私人連結，遺失後無復原功能。

## 12｜安全機制與限制

免登入，也不能任意修改別人的資料

- **伺服器專用金鑰**：Secret key 僅用於 Next.js 伺服器，不放前端，也不加 NEXT_PUBLIC_ 前綴。
- **資料庫權限**：啟用 RLS，撤銷 anon／authenticated 的直接讀寫與專案 RPC 執行權限。
- **API 防護**：輸入、請求大小與 Origin 檢查；公開讀取只回傳必要欄位。
- **公開範圍與限制**：有代碼者可看暱稱與選擇；不能完全防冒名、重複填寫或機器人。

**講稿：** 正式營運應依需求加入防濫用速率限制、資料保留與刪除政策。這些不應描述為已完成的功能。

## 13｜部署與環境變數

GitHub 保存程式，Vercel 執行，Supabase 存資料

- **01 初始化 Supabase**：建立專案，SQL Editor 執行 supabase/migrations/001_initial.sql。
- **02 GitHub → Vercel**：匯入 yoanna66/yoanna2，選 main 與 Next.js；推送更新會觸發自動部署。
- **03 設定連線網址**：SUPABASE_URL 值為專案根網址，不含 /rest/v1/。
- **04 設定伺服器金鑰**：SUPABASE_SERVICE_ROLE_KEY 值可使用 sb_secret_…；修改後重新部署。

**講稿：** 環境變數的 Key 是名稱，Value 才是網址或金鑰。此專案沿用 SERVICE_ROLE_KEY 變數名稱，但可填新版 Supabase Secret key。勿將真實金鑰放進簡報、聊天或 Git。

## 14｜正式網址與部署網址

為什麼分享後出現 Vercel 登入頁？

- **正式公開入口**：https://yoanna2.vercel.app 長期分享活動應使用這個網域。
- **個別部署入口**：帶部署編號的 *.vercel.app 網址，可能受 Vercel Authentication 保護。
- **正確分享流程**：先從正式網址開啟活動，再複製邀請連結或 QR Code。
- **活動代碼可以保留**：更換網址網域即可，不需因此重建活動；以手機或無痕視窗驗證。

**講稿：** 目前連結使用瀏覽器所在的 origin 產生。從受保護的部署網址進入，就可能複製出也需要登入的邀請。這不是要求朋友註冊平台帳號。

## 15｜測試與後續發展

區分本機測試、真實服務與未來功能

- **已執行的程式測試**：正式建置、TypeScript、6 項測試；PGlite 執行 SQL migration、權限與 RPC。
- **瀏覽器回歸**：390px／1440px；月曆、時間等寬、暱稱帶入、返回與更新不新增。
- **真實服務驗收**：部署後仍需驗證 Supabase 完整流程；npm run test:live 提供自動化驗收。
- **未來可擴充**：截止時間、資料刪除、通知、行事曆匯出，以及進一步的防濫用機制。

**講稿：** 使用者已完成 Vercel 部署並確認回填問題改善。隔離的 UI 測試和 PGlite 測試不等於遠端 Supabase 的端到端驗證，未執行的測試不可宣稱通過。

## 16｜專案連結與現場示範

從一個連結，開始下一次相聚

- **正式網站**：https://yoanna2.vercel.app
- **GitHub 原始碼**：https://github.com/yoanna66/yoanna2
- **設定與部署說明**：https://github.com/yoanna66/yoanna2/blob/main/README.md
- **建議示範順序**：建立 → 保存管理連結 → 無痕填答 → 看統計 → 修改答案 → 確認時間。

**講稿：** 示範請建立新測試活動，不要投影真實私人憑證。確認後無法再修改答案，因此最後才示範最終確認。謝謝大家。
