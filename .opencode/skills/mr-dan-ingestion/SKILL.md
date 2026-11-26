---
name: mr-dan-ingestion
description: File ingestion for JSON/MD/TXT/PDF with Persian normalization, chunking, dedupe, and idempotent storage
---

# mr-dan-ingestion

## Usage

Use when changing a loader, text normalization, chunk size, metadata, or document delete/rewrite logic.

## Pipeline

```text
bytes/file
→ normalizeText
→ loader (json | md | txt | pdf)
→ split
→ contentHash
→ dedupe check
→ deleteByMetadata(document_id)
→ embedDocuments
→ chroma.add
→ prisma.document + ingestionRun
```

## Rules

1. Normalization runs **before** split and is identical for every format.
2. Normalization output must match the oracle byte-for-byte; changing it is a parity change.
3. Chunk id is deterministic: `${documentId}:${index}`.
4. Re-ingesting the same file must not change the chunk count.
5. The content hash is SHA-256 over the normalized text plus the filename; renaming produces a new document.
6. Minimum metadata: `document_id`, `original_filename`, `file_type`, `chunk_index`; `page` for PDF and `section` for Markdown.
7. A mid-ingestion failure marks the `IngestionRun` as `failed` instead of leaving a half-written document.
8. Temporary files are created in `os.tmpdir()` and removed in `finally`.

## Normalization (in order)

1. Strip the BOM (`\uFEFF`)
2. Unify line endings: `\r\n` and `\r` → `\n`
3. Remove `\v`, `\f`
4. Collapse repeated horizontal whitespace
5. Collapse two or more blank lines into one
6. Final trim

## Chunking

- `RecursiveCharacterTextSplitter` from `@langchain/textsplitters`
- `chunkSize=800`, `chunkOverlap=120`
- Separators in order: `\n\n`, `\n`, `۔`, `.`, `،`, `؛`, `?`, `!`, ` `, `""`
- Text shorter than the size becomes one chunk; empty chunks are dropped.
- Do not add a new custom splitter without a parity test.

## Loaders

| Extension | Rule |
|---|---|
| `.json` | array or object; the first content key among `content`, `text`, `body`, `description`, `question/answer` |
| `.md` | raw text + heading extracted as `section` |
| `.txt` | raw text |
| `.pdf` | `unpdf`; one Document per page + `page` |

- Unknown format → `UnsupportedFileError` (415).
- A scanned PDF (no text layer) → an explicit error, never an empty chunk.
- Maximum upload size comes from env; default 20 MB.

## Steps — adding a new format

1. Add the loader in `application/document-loaders.ts` and register it.
2. Document the metadata contract.
3. Test: sample file → expected chunk count and metadata.
4. If the oracle has an equivalent, add a parity test; if not, record the divergence in `parity.md`.

## Checklist

- [ ] Normalization has unit tests (BOM, CRLF, ZWNJ, blank lines).
- [ ] Chunk count matches the oracle.
- [ ] Re-ingestion is idempotent.
- [ ] Deleting a document leaves zero orphan chunks.
- [ ] Temporary files are removed.
- [ ] Loader errors carry a clear Persian message.

## Anti-patterns

- Splitting unnnormalized text.
- Random UUIDs for chunks.
- Storing an uploaded file in the repo or a public path.
- Metadata typed as `any` or with scattered keys (`file`, `filename`, `name`).
