# Constitutional library data

The shipped files contain a **partial, source-indexed catalogue**, not complete constitutional text. There are no verified article bodies yet. Missing titles, translations, clauses, article totals and article-specific amendment dates must remain unavailable, never inferred or generated.

Sources inspected for metadata and selected contents entries:

- Union: [National Audit Office, 2005 English revised edition](https://www.nao.go.tz/uploads/Constitution_of_the_United_Republic_of_Tanzania_en.pdf), cover, publication note and contents pp. 3–4. Chapter count checked against contents p. 11. This edition is not asserted to be the latest consolidation.
- Zanzibar: [House of Representatives, 2020 Kiswahili edition](https://zanzibarassembly.go.tz/storage/documents/Workingdocuments/all/1679905323.pdf), publication note and contents pp. i–ix. The note says amendments through 2016. This edition is not asserted to be the latest consolidation.

`chapterCount` is the source edition's count. `articleCount: null` means a total has not been independently counted, including lettered and repealed provisions. Imported counts are calculated separately. `amendmentDate: null` does not mean no amendment occurred. Source-indexed headings can be shown in their original language; official bodies never fall back to another language.

## Import workflow

1. Obtain the official source file. Record its government URL, edition, locator/page and SHA-256 checksum (`Get-FileHash -Algorithm SHA256 <file.pdf>`).
2. Prepare a JSON bundle with the schema in `src/types/constitution.ts`; use the existing document bundle as a structural starting point. Extract/transcribe wording exactly. Preserve every clause label, deleted provision marker and sub-clause order. Do not use generated wording or silently correct source spelling. Put each language in its own `texts.sw` / `texts.en` record.
3. Set text status to `pending`. Have a human reviewer compare **every character, number, title and clause** with the source and confirm the relevant edition and amendments. Only after review, set that language's source to `verified` and record `verifiedBy`, `verifiedAt`, `sourceLocator`, and `checksum`. Set the article's source status consistently. A checksum identifies the source; it does not verify the transcription.
4. Run `node scripts/import-constitution.cjs path/to/bundle.json` for a dry run. Invalid cross-document links, duplicate IDs/numbers, cyclic parts, mismatched editions, missing review provenance, unsafe URLs and false completeness are rejected. Validation never promotes pending text or certifies accuracy.
5. Run the same command with `--write` to atomically replace the selected document's JSON file. Paths are fixed by the document ID. Include the full existing inventory in the replacement bundle; this is not a merge. Review the diff. Set `inventoryComplete` only after reconciling the entire source contents and exact counts.
6. Run `node --test scripts/constitution.test.cjs`, `npm run type-check`, `npm run lint`, and `npx expo export --platform web`.

`ConstitutionPart.parentPartId` supports nested subsections. Articles reference a chapter and optional part; clauses recursively contain children and retain their source numbering. `order` is explicit, so 46, 46A and 46B can be navigated correctly. The reader's previous/next controls traverse imported records and disclose gaps while the inventory is incomplete.

`constitutionRepository` in `src/services/constitution.ts` is the local data boundary for a future API/database. `ClarificationService` accepts an article, edition, language and conversation history, and returns a response with the same article/edition context. The current implementation gives clearly labelled local mock study prompts, never invented interpretations of missing text.

`legacy-demo-sections.json` is quarantined homepage fixture data, not an official legal source. `mockData.ts` adapts its flat records to the existing homepage cards. The library, official reader, search, citations and clarification service do not use its bodies or chapter placement. In particular, the old demo's expression label for Article 19 must not enter official data: the source index places expression at Article 18 and religion at Article 19.

Citizen comments/proposals use per-article, per-edition device storage. Only the subject-matching Article 13 demo poll is reused; no existing demo comment, proposal, history or explanation is represented as verified library content.
