# Valuation Image Upload Flow (End-to-End)

This document explains the complete flow for valuation images in this app, from tapping a card to the image reaching the server. It also maps each phase to the exact code and explains why each piece exists.

---

## 0) Big Picture (One-Page Summary)

**Goal:** When a user captures an image on the Valuation screen, we want it to:
1) Save safely on device (offline-first),
2) Show immediately in UI (green card),
3) Queue for upload (DB),
4) Upload automatically when online, and
5) Update status (uploaded / failed) with retry tracking.

Core pipeline:
1) **ValuationPage** -> user taps card -> **navigate to Camera**
2) **CameraScreen** captures image -> saves file -> inserts DB row -> updates UI store
3) **SyncManager** sees pending count -> triggers **Imageuploadservice**
4) **Imageuploadservice** reads file -> Base64 -> API call
5) DB row marked `uploaded` or `failed`

---

## 1) Phase A — Valuation Screen (User Click)

### What happens
- Valuation screen lists all capture steps (sides/cards).
- Each card can be tapped. If previous steps are required, card remains locked.
- Tapping a card opens Camera screen with `leadId`, `side`, and `appColumn`.

### Code (why & how)
**File:** `src/pages/ValuationPage.tsx`

**Card component:** `ValuateCard`
- **Why:** Centralizes card UI + click logic.
- **How:** If step is allowed, `navigation.navigate("Camera", ...)` is called with the correct params.

Key logic:
- `handleClick()` uses `isClickable` and `isDone` to allow retakes.
- `appColumn` is passed to upload API as the dynamic field name later.

**Card gating logic:**
- `isClickable` is true only if previous steps are done.
- This ensures sequential capture order if required.

---

## 2) Phase B — Camera Capture

### What happens
- Camera screen captures an image with `react-native-vision-camera`.
- Image is saved permanently in app storage via `RNFS`.
- A DB row is inserted/updated in `image_captures` table.
- Local store (Zustand) is updated so UI shows green instantly.
- SyncManager is notified to refresh pending count.

### Code (why & how)
**File:** `src/components/CameraScreen.tsx`

**Key function:** `handleCapture()`
- **Step 1:** Capture photo using `cameraRef.current.takePhoto(...)`.
- **Step 2:** Save file locally using `saveImageLocally()`.
- **Step 3:** Save DB record using `saveImageCapture()`.
- **Step 4:** Update UI store with `markLocalCaptured(...)`.
- **Step 5:** Inform SyncManager using `SyncManager.refreshPendingCount()`.

**Why this design:**
- Local file is the source of truth for offline mode.
- DB row enables upload queue and retry tracking.
- Store update gives immediate UI feedback.

---

## 3) Phase C — Local File Save (Persistent Storage)

### What happens
- A temporary camera file is copied to a permanent directory:
  `DocumentDirectoryPath/kwikcheck/leads/{leadId}/{side}.jpg`

### Code (why & how)
**File:** `src/services/Imageuploadservice.ts`

**Function:** `saveImageLocally({ leadId, side, tempUri })`
- Creates per-lead directory if not exists.
- Normalizes side name to file name (lowercase, underscores).
- Copies temp file to permanent file.
- Returns `file://` URI for consistent usage in RN.

**Why this design:**
- Permanent storage ensures images persist across app restarts.
- Per-lead folder keeps data organized and easy to cleanup later.

---

## 4) Phase D — DB Queue Entry (Offline-First)

### What happens
- After file saved, a DB record is created in `image_captures`.
- Each row is a single image capture with upload status.
- `UNIQUE(lead_id, side)` enforces one image per side; retakes overwrite.

### Code (why & how)
**File:** `src/database/imageCaptureDb.ts`

**Table:** `image_captures`
Fields:
- `lead_id` : lead identifier
- `side` : card name
- `app_column` : API field name (dynamic payload key)
- `local_path` : local file URI
- `upload_status` : `pending | uploading | uploaded | failed`
- `retry_count` : retries (max 3)

**Function:** `saveImageCapture(...)`
- Uses `INSERT OR REPLACE` so retake replaces old row.
- Status set to `pending` by default.

**Why this design:**
- Queue needs reliable state even when app is killed.
- Unique key ensures only latest retake exists.

---

## 5) Phase E — UI State Update (Instant Feedback)

### What happens
- The card on ValuationPage turns green immediately after capture.
- This uses local store state, not server response (offline-first).

### Code (why & how)
**File:** `src/store/valuation.store.ts`

**Function:** `markLocalCaptured(side, localUri)`
- Adds or updates `sideUploads` array.
- This array powers card state (image shown + retake badge).

**File:** `src/pages/ValuationPage.tsx`
- `getClickedImage()` reads from `getSideUpload()`.
- If a URI exists, card shows image + retake badge.

---

## 6) Phase F — Loading Old Captures on Re-open

### What happens
- When ValuationPage loads, it fetches captures from DB.
- Only existing files are shown (safety check).
- A pre-marking step prevents old captures from triggering question modals.

### Code (why & how)
**File:** `src/pages/ValuationPage.tsx`

**Function:** `loadCapturedMedia()`
- Calls `getCapturedMediaByLeadId(leadId)`.
- Pre-marks all sides in `processedSidesRef`.
- Checks `RNFS.exists(filePath)`.
- Calls `markLocalCaptured()` for each valid file.

**File:** `src/database/valuationProgress.db.ts`
- `getCapturedMediaByLeadId()` queries `image_captures` and maps to UI-friendly shape.

**Why this design:**
- Prevents stale data from reopening modals.
- Ensures broken paths do not crash UI.

---

## 7) Phase G — Auto Upload Trigger

### What happens
- SyncManager watches network state.
- When device goes online, it uploads pending images.
- User can also manually sync (ValuationListScreen).

### Code (why & how)
**File:** `src/services/Syncmanager.ts`

**Key logic:**
- `NetInfo.addEventListener(...)` listens for connectivity changes.
- When online and pending exists -> `runUpload()` starts.
- `runUpload()` calls `uploadPendingImages()`.

**Initialization:**
- `App.tsx` calls `SyncManager.init(user.token)` after login.
- `SyncManager.destroy()` called on logout (AppStore).

**Why this design:**
- Background syncing keeps user free from manual steps.
- Offline-first means uploads should wait for connectivity.

---

## 8) Phase H — Upload Execution (File -> Base64 -> API)

### What happens
- Pending DB rows are read.
- Each file is converted to Base64.
- API `DocumentUploadOtherImageApp` is called.
- On success: mark `uploaded`. On failure: mark `failed` and increment retry count.

### Code (why & how)
**File:** `src/services/Imageuploadservice.ts`

**Key functions:**
1) `uploadPendingImages(token)`
   - Loads all `pending` / `failed` images.
   - Uploads sequentially (300ms delay) to reduce server load.

2) `uploadSingleImage(token, image)`
   - `markUploading(image.id)`
   - `RNFS.exists(filePath)` check
   - `RNFS.readFile(filePath, 'base64')`
   - `uploadImageApi()` call
   - `markUploaded()` on success
   - `markFailed()` on error

3) `uploadImageApi(token, image, base64)`
   - Builds payload with dynamic field: `{ [image.app_column]: base64 }`
   - Hits `DocumentUploadOtherImageApp`

**Why this design:**
- Queue is reliable: DB changes reflect each step.
- Base64 is required by backend API.
- Sequential upload avoids overload and reduces failures.

---

## 9) Phase I — Manual Sync (Per Lead)

### What happens
- User opens ValuationListScreen.
- Sees pending uploads per lead and can press `Sync Now`.
- This uploads only that lead’s pending images.

### Code (why & how)
**File:** `src/pages/ValuationListScreen.tsx`
- `syncLead(leadId)` selects pending rows for that lead.
- Calls `uploadSingleImage()` for each.
- Updates UI stats after completion.

**Why this design:**
- Allows user to force upload for a specific lead.
- Useful in weak network scenarios.

---

## 10) Phase J — Question Modal (After Capture)

### What happens
- After a new capture, a modal can appear asking questions (odometer, chassis, etc).
- This uses app steps from DB.
- In this workspace, `useQuestions` is currently disabled (returns null), so modal relies on step data only.

### Code (why & how)
**File:** `src/pages/ValuationPage.tsx`
- `useEffect` watches `sideUploads` and opens modal for the newest capture.
- `processedSidesRef` prevents showing for old images.

**File:** `src/services/useQuestions.ts`
- Stubbed; returns null for offline mode.

**Why this design:**
- The modal is tied to capture event, not upload.
- It ensures required details are gathered immediately.

---

## 11) Phase K — Status Tracking & Retries

### What happens
- Each image row has `upload_status` and `retry_count`.
- Failed uploads are retried up to 3 times.
- Pending count is used for badges / stats.

### Code (why & how)
**File:** `src/database/imageCaptureDb.ts`
- `getPendingImages()` -> pending queue
- `markUploading()` / `markUploaded()` / `markFailed()`
- `getPendingCount()` -> used by SyncManager / UI

**Why this design:**
- Prevents infinite retry loops.
- Gives clear status for UX and support.

---

## 12) Phase L — Why Offline-First Matters Here

- Network can be slow or absent during inspections.
- Saving locally ensures no data loss.
- Upload happens later without blocking user.

This is why the code **always saves locally first** and never depends on API success to show the image on the UI.

---

## 13) Quick Trace (Single Image Example)

Example: User captures "Front Side" for lead `123`.

1. **ValuationPage** -> tap card -> `navigation.navigate("Camera", { id: 123, side: "Front Side", appColumn: "FrontSideBase64" })`
2. **CameraScreen** -> capture photo -> `saveImageLocally()` -> `/kwikcheck/leads/123/front_side.jpg`
3. **imageCaptureDb** -> `saveImageCapture()` row inserted with `pending`
4. **valuation.store** -> `markLocalCaptured()` -> UI shows image + retake badge
5. **SyncManager** -> pending count refreshed -> if online -> `uploadPendingImages()`
6. **Imageuploadservice** -> file exists -> read base64 -> API call
7. **DB** -> `markUploaded()` or `markFailed()`

---

## 14) Files & Responsibilities (Cheat Sheet)

- `src/pages/ValuationPage.tsx`
  - Card UI, navigation to Camera, modal handling, loading old captures

- `src/components/CameraScreen.tsx`
  - Capture image, save local, insert DB, update store

- `src/services/Imageuploadservice.ts`
  - File -> Base64 -> API upload, sequential queue processing

- `src/services/Syncmanager.ts`
  - Network listener + auto sync triggers

- `src/database/imageCaptureDb.ts`
  - Offline queue schema + status updates

- `src/database/valuationProgress.db.ts`
  - Load captured media for ValuationPage

- `src/store/valuation.store.ts`
  - UI state for captured images

- `src/pages/ValuationListScreen.tsx`
  - Manual per-lead sync and upload stats

---

## 15) Known Stubs / Disabled Parts

- `src/services/useQuestions.ts` currently returns `null` for offline mode.
- `src/services/uploadQueue.manager.ts` is a stub (queue badge not active).
- `setTotalCount()` and `updateLeadMetadata()` in `valuationProgress.db.ts` are disabled.

---

## 16) If You Want More Logs

For debugging, use these log points:
- Camera capture: `[Camera]` logs in `CameraScreen.tsx`
- DB insert: `[ImageDB]` in `imageCaptureDb.ts`
- Upload steps: `[Upload]` and `[API]` in `Imageuploadservice.ts`
- Sync triggers: `[SyncManager]` in `Syncmanager.ts`

---

If you want, I can also add a sequence diagram or a step-by-step flowchart in this file.
