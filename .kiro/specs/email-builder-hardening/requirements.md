# Requirements Document

## Introduction

This hardening effort addresses confirmed bugs and performance issues in the email builder application (Next.js + Zustand + Firebase/Firestore). The changes span Firestore query correctness, Zustand store data integrity, environment configuration hygiene, and memory performance. All fixes are pure refactors — no new user-visible features are introduced. The goal is a codebase that is correct under concurrent load, does not silently persist unsaved editor drafts, never exposes secrets in source code, and does not degrade in performance as the component tree grows.

---

## Glossary

- **FirebaseService**: The singleton class in `services/firebase-service.ts` that wraps all Firestore and Firebase Storage calls.
- **EmailBuilderStore**: The Zustand store in `store/email-builder-store.ts` that manages editor state, undo/redo history, and change detection.
- **VSBStore**: The Zustand store in `store/vsb-store.ts` that manages Variable Section Booklets (VSBs).
- **VSB**: Variable Section Booklet — a named set of variable copy, alt-name images, desktop/mobile view data, and header details attached to a template.
- **HISTORY_LIMIT**: The constant controlling how many undo/redo snapshots are retained in memory and persisted.
- **EditorSnapshot**: A single undo/redo entry containing all three component arrays plus preheader text and option metadata.
- **Persist Middleware**: The Zustand `persist` middleware that serialises selected store slices to `localStorage`.
- **MLR Connection**: The workflow in `app/vsb/[templateId]/page.tsx` that downloads a PDF and then calls an external OTP endpoint before opening the MLR Catalyst URL.
- **Composite Index**: A Firestore index spanning more than one field (e.g., `templateId` + `versionNumber`) required for compound queries.
- **forcedResync**: A `Set<string>` inside `getAllTemplates()` that unconditionally re-copies named templates on every dashboard load.
- **getVersions**: The `FirebaseService.getVersions(templateId)` method that retrieves version history for a template.
- **duplicateVSB**: The `VSBStore.duplicateVSB(id)` action that is supposed to create a persistent copy of a VSB.
- **checkForChanges**: The `EmailBuilderStore.checkForChanges()` method called after every state mutation to compute `hasComponentChanges`.
- **Revision Counter**: A monotonically incrementing integer incremented on each meaningful state change, used as a cheap change-detection signal in place of deep JSON comparison.

---

## Requirements

---

### Requirement 1: Firestore Query Efficiency for Version History

**User Story:** As a developer maintaining the application, I want `getVersions()` to query only the versions belonging to a specific template, so that the application does not perform a full-collection scan that grows in cost as the version history expands.

#### Acceptance Criteria

1. WHEN `getVersions(templateId)` is called, THE `FirebaseService` SHALL include a Firestore `where("templateId", "==", templateId)` clause in the query so that only documents matching that template are fetched from Firestore.
2. WHEN `getVersions(templateId)` is called, THE `FirebaseService` SHALL include both a `where("templateId", "==", templateId)` filter and an `orderBy("versionNumber", "asc")` clause in the same query so that a composite index on `(templateId, versionNumber)` is used.
3. THE `FirebaseService` SHALL NOT filter the version results in JavaScript after fetching; all filtering SHALL be performed by the Firestore query.
4. WHEN the Firestore composite index on `(templateId ASC, versionNumber ASC)` does not exist, THE `FirebaseService` SHALL surface the Firestore index-required error to the caller rather than silently returning an empty array.

---

### Requirement 2: Persistent VSB Duplication

**User Story:** As an email builder user, I want duplicating a VSB to create a permanent copy in the database, so that my duplicate is not lost when I refresh the page.

#### Acceptance Criteria

1. WHEN `duplicateVSB(id)` is called, THE `VSBStore` SHALL call `firebaseService.createVSB(duplicateData)` to persist the duplicate to Firestore before updating local state.
2. WHEN `firebaseService.createVSB` returns successfully, THE `VSBStore` SHALL use the Firestore-assigned document ID as the duplicate's `id` rather than `Date.now().toString()`.
3. WHEN `firebaseService.createVSB` throws an error, THE `VSBStore` SHALL set `error` to the error message, SHALL NOT add the duplicate to the local `vsbs` array, and SHALL leave the original VSB unchanged.
4. WHEN the user refreshes the page after duplicating a VSB, THE `VSBStore` SHALL be able to fetch the duplicate from Firestore via `fetchVSBs(templateId)`.

---

### Requirement 3: MLR Connection Configuration via Environment Variables

**User Story:** As a developer deploying the application, I want the MLR OTP endpoint URL and sender email to be read from environment variables, so that no credentials or infrastructure addresses are committed to source code.

#### Acceptance Criteria

1. THE `VSB Page` SHALL read the MLR API base URL from the `NEXT_PUBLIC_MLR_API_URL` environment variable and SHALL NOT contain the string `34.55.227.107` or any other hardcoded IP address or hostname in source code.
2. THE `VSB Page` SHALL read the MLR sender email address from the `NEXT_PUBLIC_MLR_SENDER_EMAIL` environment variable and SHALL NOT contain the string `kumar@medtrixhealthcare.com` or any other hardcoded email address in source code.
3. IF `NEXT_PUBLIC_MLR_API_URL` is not set at runtime, THEN THE `VSB Page` SHALL log a descriptive error and SHALL NOT make a network request to `undefined` or an empty URL.
4. IF `NEXT_PUBLIC_MLR_SENDER_EMAIL` is not set at runtime, THEN THE `VSB Page` SHALL log a descriptive error and SHALL NOT send a request body containing `undefined` as the email value.

---

### Requirement 4: Rename `seisConnectingToMRL` State Setter

**User Story:** As a developer reading the VSB page component, I want the `useState` setter for the MLR connection loading flag to be correctly named `setIsConnectingToMRL`, so that the codebase is self-documenting and the typo does not cause confusion.

#### Acceptance Criteria

1. THE `VSB Page` SHALL declare the MLR connection state as `const [isConnectingToMRL, setIsConnectingToMRL] = useState(false)` — the setter name SHALL be `setIsConnectingToMRL`, not `seisConnectingToMRL`.
2. WHEN `handleMLRconnection` sets or clears the connection flag, THE `VSB Page` SHALL call `setIsConnectingToMRL(true)` and `setIsConnectingToMRL(false)` respectively.
3. THE `VSB Page` SHALL contain zero references to the identifier `seisConnectingToMRL`.

---

### Requirement 5: Correct Default Header Text Encoding

**User Story:** As an email builder user creating a new VSB, I want the default "To" header value to contain the correct typographic apostrophe `[HCP's email address]`, so that the field does not display garbage characters in the UI and exported PDF.

#### Acceptance Criteria

1. WHEN `handleCreateVSB` constructs the default `headerDetails` array, THE `VSB Page` SHALL set the `"To"` field value to the string `[HCP's email address]` using a correctly encoded Unicode apostrophe (U+2019) or the plain ASCII apostrophe `'`.
2. THE `VSB Page` SHALL NOT contain the byte sequence `Ã¢â‚¬â„¢` or any other mojibake representation of an apostrophe in the default header details.
3. WHEN a VSB is created via `createVSB`, THE `FirebaseService` SHALL store and retrieve the header value without further encoding corruption.

---

### Requirement 6: Separate Read Logic from Mutation Logic in `getAllTemplates`

**User Story:** As a developer calling `getAllTemplates()`, I want the function to be a pure read that never modifies Firestore, so that concurrent calls do not cause race conditions, duplicate deletions, or unintended data loss.

#### Acceptance Criteria

1. THE `FirebaseService` SHALL provide a dedicated migration/admin function (separate from `getAllTemplates`) that encapsulates template deduplication, legacy deletion, brand correction, and content seeding logic.
2. WHEN `getAllTemplates()` is called, THE `FirebaseService` SHALL only read from Firestore and SHALL NOT call `deleteDoc`, `updateDoc`, or `addDoc` inside the same execution path.
3. WHEN `getAllTemplates()` is called concurrently from multiple browser tabs, THE `FirebaseService` SHALL NOT produce duplicate delete operations or conflicting write operations on the same document.
4. THE `FirebaseService` SHALL preserve the existing observable behaviour of returning a correctly filtered and ordered template list, even after the mutation logic is extracted.

---

### Requirement 7: Remove `forcedResync` Block for `Idorsia_RTE`

**User Story:** As a developer maintaining the dashboard, I want the `forcedResync` block that unconditionally re-copies `Idorsia_RTE` on every load to be removed, so that the dashboard load does not perform unnecessary Firestore writes and the template's content is not overwritten on each visit.

#### Acceptance Criteria

1. THE `FirebaseService` `getAllTemplates` method SHALL NOT contain a `forcedResync` `Set` that includes `"Idorsia_RTE"` or any other template name.
2. WHEN the dashboard loads and `getAllTemplates()` is called, THE `FirebaseService` SHALL NOT call `updateDoc` for `Idorsia_RTE` unless the template is actually blank or has the wrong brand (i.e., it SHALL follow the same conditional path as all other templates).
3. THE `FirebaseService` SHALL remove the associated comment referencing the need to remove the `forcedResync` logic after confirmation.

---

### Requirement 8: Persist `currentVsb` Across Page Refreshes

**User Story:** As an email builder user editing a VSB, I want my active VSB selection to survive a page refresh, so that I do not lose my place and have to re-select the VSB from the list.

#### Acceptance Criteria

1. WHEN the `VSBStore` persist middleware serialises state to `localStorage`, THE `VSBStore` SHALL include either `currentVsb` or a `currentVsbId` field in the persisted slice.
2. WHEN the application hydrates from `localStorage` and a `currentVsbId` is found, THE `VSBStore` SHALL re-select the matching VSB from the `vsbs` array and set `currentVsb` accordingly.
3. WHEN the `vsbs` array does not contain a VSB matching the persisted `currentVsbId` (e.g., it was deleted remotely), THE `VSBStore` SHALL set `currentVsb` to `null` rather than throwing an error.
4. IF `currentVsb` is persisted directly, THEN THE `VSBStore` SHALL re-validate it against the latest Firestore data on the next `fetchVSBs` call so that stale persisted data is replaced.

---

### Requirement 9: Replace JSON.stringify Change Detection with Revision Counter

**User Story:** As an email builder user editing a large template, I want change detection to be computationally cheap, so that adding or updating components does not cause noticeable UI lag.

#### Acceptance Criteria

1. THE `EmailBuilderStore` SHALL maintain a `revisionCounter` integer that is incremented by 1 each time any component array (`components`, `option2Components`, `option3Components`) or `preheaderText` is mutated.
2. WHEN `checkForChanges()` is called, THE `EmailBuilderStore` SHALL compare the current `revisionCounter` against a `savedRevision` baseline rather than calling `JSON.stringify` on component arrays.
3. THE `EmailBuilderStore` SHALL set `hasComponentChanges` to `true` when `revisionCounter !== savedRevision` and `false` when they are equal.
4. WHEN `markComponentsSaved()` is called, THE `EmailBuilderStore` SHALL update `savedRevision` to the current `revisionCounter` value.
5. THE `EmailBuilderStore` SHALL NOT call `JSON.stringify` on any component array inside `checkForChanges()`.

---

### Requirement 10: Reduce History Limit and Exclude History from Persistence

**User Story:** As an email builder user, I want undo/redo history to use a reasonable memory budget and not bloat `localStorage`, so that the browser does not slow down after extended editing sessions.

#### Acceptance Criteria

1. THE `EmailBuilderStore` SHALL set `HISTORY_LIMIT` to 20 (reduced from 100).
2. WHEN the `EmailBuilderStore` persist middleware serialises state to `localStorage`, THE `EmailBuilderStore` SHALL exclude both `past` and `future` arrays from the persisted slice.
3. WHEN the application loads from `localStorage`, THE `EmailBuilderStore` SHALL initialise `past` and `future` as empty arrays regardless of any previously persisted values.
4. THE `EmailBuilderStore` SHALL still enforce the `HISTORY_LIMIT` cap when pushing new snapshots to `past` in memory.

---

### Requirement 11: Keep Unsaved Editor Drafts Out of Local Storage

**User Story:** As an email builder user, I want unsaved editor drafts to remain in the editor only, so that stale drafts are not automatically restored from browser storage.

#### Acceptance Criteria

1. THE email builder SHALL NOT write unsaved editor component state to `localStorage`.
2. WHEN the builder loads, THE email builder SHALL remove any legacy `email_builder_autosave` entry.
3. THE email builder SHALL continue to persist changes through its existing explicit save flow.

---

### Requirement 12: Exclude VSB Component Trees from Persist Middleware

**User Story:** As an email builder user with multiple large VSBs, I want the VSB store to avoid serialising full component HTML trees to `localStorage` on every change, so that the browser storage quota is not exhausted and store hydration remains fast.

#### Acceptance Criteria

1. WHEN the `VSBStore` persist middleware serialises state to `localStorage`, THE `VSBStore` SHALL exclude the `vsbs` array (which contains full component trees including HTML strings) from the persisted slice.
2. WHERE VSB metadata persistence is desired, THE `VSBStore` MAY persist only lightweight VSB metadata fields (such as `id`, `templateId`, `currentVersion`, `createdAt`, `updatedAt`) rather than the full `VSBData` objects.
3. WHEN the application loads from `localStorage`, THE `VSBStore` SHALL initialise `vsbs` as an empty array and rely on `fetchVSBs(templateId)` to repopulate from Firestore.
4. THE `VSBStore` SHALL continue to persist `currentVsb` or `currentVsbId` as required by Requirement 8.

---

### Requirement 13: Firestore Composite Index for Version Queries

**User Story:** As a developer deploying the application, I want the Firestore index configuration to declare the composite index required by the `getVersions` query, so that version history loads efficiently and does not hit Firestore index errors in production.

#### Acceptance Criteria

1. THE `FirebaseService` project configuration SHALL include a composite index definition for the `email-versions` collection with fields `templateId ASC` and `versionNumber ASC`.
2. WHEN `getVersions(templateId)` executes the compound `where + orderBy` query (as fixed by Requirement 1), THE `FirebaseService` SHALL not receive a `FAILED_PRECONDITION` error from Firestore due to a missing index.
3. THE composite index definition SHALL be declared in the project's `firestore.indexes.json` file so that it can be deployed with the Firebase CLI.

---

### Requirement 14: Extract Dashboard Side-Effect Logic to a One-Time Migration Function

**User Story:** As a developer maintaining the application, I want template deduplication, brand correction, and seeding logic to run only once (or on explicit admin action) rather than on every dashboard load, so that the dashboard is fast, read-only fetches do not trigger writes, and the codebase is easier to reason about.

#### Acceptance Criteria

1. THE `FirebaseService` SHALL expose a dedicated `runTemplateMigration()` method that contains all deduplication, legacy deletion, brand correction, and seeding logic currently embedded in `getAllTemplates()`.
2. WHEN `getAllTemplates()` is called during a normal dashboard load, THE `FirebaseService` SHALL NOT invoke `runTemplateMigration()` or any equivalent inline logic that performs writes.
3. WHEN `runTemplateMigration()` is called explicitly (e.g., from an admin panel or a one-time migration script), THE `FirebaseService` SHALL execute the full deduplication, correction, and seeding workflow and SHALL return a summary of the changes made.
4. THE `FirebaseService` `getAllTemplates()` method SHALL remain a pure read function that returns all templates sorted by name without modifying any Firestore documents.
5. WHEN `getAllTemplates()` is called concurrently, THE results SHALL be deterministic and no Firestore write operations SHALL be triggered, satisfying the race-condition constraint stated in Requirement 6.
