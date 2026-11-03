# 揪時間

繁體中文、手機優先的開放式時間協調網站。Next.js App Router + TypeScript + Tailwind CSS + Supabase PostgreSQL，可部署 Vercel。無固定群組、不需註冊。**沒有假資料模式**，未設定 Supabase 時，資料操作會回傳明確的 503 訊息。

## 規劃與使用流程

1. `/`：介紹、建立活動、輸入 12 碼活動代碼加入。
2. `/create`：輸入名稱、發起人及 1–40 個候選時段，所有輸入以台灣時間 UTC+8 解讀，資料庫儲存 timestamptz。
3. `/events/[code]/invite`：活動代碼、公開邀請連結、本機產生 QR Code。建立完成時另顯示私人管理連結，務必保存。
4. `/events/[code]/respond`：輸入暱稱及複選時段，可全不選。提交後取得私人修改連結；使用 `#edit=...` 載入並更新同一筆紀錄。
5. `/events/[code]/results`：從資料庫取得參與者與時段統計，處理零答案、全員無空、並列最高、全員可參加。點「更新統計」取得最新資料。持有 `#admin=...` 者可確認最終時段，確認後停止所有提交與修改且不可改選。

每個新活動獨立產生 48-bit 隨機公開代碼及 UUID。修改與管理權限則使用 256-bit 隨機憑證。**請勿將管理或修改連結當成公開邀請連結分享**。憑證遺失無法找回。暱稱不具唯一性，也不會以暱稱合併不同人的答案。

## 資料庫結構

見 `supabase/migrations/001_initial.sql`：

- `events`：UUID、唯一公開代碼、標題、發起人、管理憑證 SHA-256、最終時段、建立時間。
- `slots`：UUID、活動外鍵、起訖時間；檢查區間有效且每活動不可重複。
- `participants`：UUID、活動外鍵、暱稱、修改憑證 SHA-256、可參加時段 UUID 陣列、更新時間；`(event_id, edit_hash)` 唯一。
- 最終時段以複合外鍵保證屬於同一活動。時段選擇透過受限制的 RPC 驗證，無法選擇其他活動的時段。
- RPC `create_event` 原子建立活動及候選時段；`save_response` 與 `confirm_event` 對活動列加鎖，避免提交與封存競爭；相同提交憑證的重試為冪等。

## 安全機制與公開範圍

所有資料表啟用 RLS，撤銷 `anon`/`authenticated` 直接讀寫及 RPC 執行權限。只有 Next.js 伺服器使用 service role 呼叫白名單 RPC。瀏覽器不需要 Supabase 金鑰。公開讀取投影排除管理雜湊、修改雜湊及參與者內部 ID。所有寫入使用 Zod 驗證、body 大小限制及同來源 Origin 檢查；SQL 使用參數化呼叫。

私人憑證放在網址 fragment，不放在 query/path，因此一般請求與 Referrer 不含它。只在寫入或載入私人答案時透過 HTTPS JSON 傳給伺服器；只儲存 SHA-256。不要在代理、APM 或自訂日誌中記錄請求 body，也不要加入會讀取 fragment 的第三方追蹤。API 不快取；頁面設定 `Referrer-Policy: no-referrer`。勿向前端暴露 service role；也勿將它命名成 `NEXT_PUBLIC_*`。

活動是可分享的公開協調空間：知道代碼的人可讀暱稱與所有時段選擇。請勿填寫敏感個資。不提供登入身分驗證，**無法完全防止重複填寫、冒用暱稱或機器人**；修改連結只保護該筆紀錄。正式公開營運請在 Vercel Firewall 設定建立/提交 API 的 rate limiting 和必要的機器人防護，並依流量、隱私政策設計資料保留/刪除流程。目前無 CAPTCHA、通知、編輯候選時段或管理憑證復原功能。

## Supabase 設定

1. 在 Supabase 建立專案，等資料庫完成初始化。
2. 開啟 SQL Editor，執行 `supabase/migrations/001_initial.sql` 全部內容（僅首次執行；之後新增 migration，不要重跑已建立的表）。此腳本假設標準 Supabase 的 `anon`、`authenticated`、`service_role` 角色已存在。不需開啟 Auth 或 Realtime。
3. 從專案設定取得 Project URL 及 legacy `service_role` key（伺服器專用，勿使用 publishable/anon key 代替）。將值放入本機 `.env.local` 或 Vercel 的私密環境變數，不要貼到聊天或提交 Git。
4. 確認上述三個資料表 RLS 都啟用，且沒有另外新增公開政策。此專案刻意不允許前端直接查 Supabase。

```sh
cp .env.example .env.local
# 編輯 .env.local，填入自己的值
```

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

受限制的雲端環境另需允許 `YOUR_PROJECT.supabase.co` 的 HTTPS 存取。不要停用 TLS 驗證。若平台提供的憑證僅限 HTTPS 代理注入，請依平台支援方式設定對應 Supabase 目的地；本機/Vercel 使用真正的伺服器環境變數。

## 本機開發與測試

Node.js 22.12+（目前使用 Node 24），npm，安裝步驟：

```sh
npm ci --cache /tmp/ju-time-npm-cache
npm run dev
```

在本機瀏覽器開啟開發伺服器的 3000 埠。程式能在缺少環境變數時建置及顯示首頁，但資料 API 會回傳 503，不代表資料庫已連線。

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm test` 包含輸入驗證、統計，以及使用 PGlite 真正執行 PostgreSQL migration 和 RPC 的整合測試：匿名權限、跨活動時段拒絕、修改不新增、錯誤憑證拒絕、封存後拒絕修改。PGlite 測試不等於遠端 Supabase/PostgREST 的端到端驗證。

選用瀏覽器 smoke test（需先啟動應用程式與安裝 Chromium）：

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

已啟動且連接真實 Supabase 後，可執行 `npm run test:live`。它會建立一個保留在資料庫的「整合驗收（測試資料）」活動，驗證建立、讀取、修改不重複、錯誤憑證、確認與封存。可用 `TEST_BASE_URL` 指向測試部署。請勿對他人的正式活動執行破壞式驗收。

### 連接真實 Supabase 後的必要驗收

- 建立兩個活動；重新整理確認持續存在，且代碼不同。
- 將公開邀請傳至無痕視窗，以不同暱稱送出答案，結果頁更新後應有對應數據。
- 保存專屬修改連結，在另一個視窗開啟後更新選擇，確認總紀錄數不增加。
- 用錯誤/截斷的修改憑證應被拒絕；不能因知道暱稱而更改其答案。
- 使用管理連結選擇最終時段，確認一般訪客無法管理，確認後提交或修改都失敗。
- 嘗試使用 anon key 直接操作資料表或 RPC，應被拒絕。
- 重新啟動應用程式，資料與專屬修改連結仍有效。測試手機 390px 與桌面版。

## Vercel 部署

1. 將本專案推送到你的 GitHub 儲存庫（本次不會自動 push）。
2. Vercel → Add New Project → 匯入儲存庫，Framework 選 Next.js；根目錄為本專案。
3. 在 Vercel Environment Variables 設定 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`，為 Production 和需要的 Preview 分別設定適當資料庫。勿勾選公開前綴或提交 `.env.local`。
4. Build command `npm run build`，Install command `npm ci`，Node 22 或 24。Deploy 後用正式 HTTPS 網域重新完成上方必要驗收。
5. 邀請與 QR Code 使用目前瀏覽器的 origin，不用寫死網域；正式邀請請從正式網域建立/複製。Preview 不應分享為長期連結。
6. 變更環境變數後重新部署。使用 Supabase 備份與 Vercel Firewall 控制營運風險。

## 目前驗證範圍

測試報告以交付訊息為準。未提供真實 Supabase 專案/伺服器憑證前，不宣稱遠端持久化、PostgREST 或 Vercel 部署已經驗證。網站不會自動建立 Supabase 專案或套用遠端 migration。
