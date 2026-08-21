const fs = require('fs');
const path = require('path');

const KNOWLEDGE_BASE_DIR = path.join(__dirname, 'knowledge-base');
const MAX_PASSAGE_CHARS = 900;
const MAX_PASSAGES_RETURNED = 4;

/**
 * RagEngine
 * Deterministic, dependency-free retrieval over local Markdown files.
 * Splits each document into passages (by heading sections), scores
 * passages against the query using lightweight keyword overlap, and
 * returns only the top-scoring passages as grounded context.
 *
 * Retrieved content is treated as untrusted reference data: it is
 * never treated as executable instructions, and the caller (agent.js /
 * generator.js) is responsible for wrapping it clearly as reference
 * material in the prompt sent to the LLM.
 */
class RagEngine {
  constructor(knowledgeBaseDir = KNOWLEDGE_BASE_DIR) {
    this.knowledgeBaseDir = knowledgeBaseDir;
    this.documents = [];
    this._loaded = false;
  }

  loadDocuments() {
    if (this._loaded) return this.documents;
    this.documents = [];

    if (!fs.existsSync(this.knowledgeBaseDir)) {
      console.warn(`[ragEngine] Knowledge base directory not found: ${this.knowledgeBaseDir}`);
      this._loaded = true;
      return this.documents;
    }

    const files = fs
      .readdirSync(this.knowledgeBaseDir)
      .filter((f) => f.toLowerCase().endsWith('.md'));

    for (const file of files) {
      const fullPath = path.join(this.knowledgeBaseDir, file);
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const passages = this._splitIntoPassages(raw, file);
        this.documents.push({ file, passages });
      } catch (err) {
        console.warn(`[ragEngine] Failed to read ${file}: ${err.message}`);
      }
    }

    this._loaded = true;
    return this.documents;
  }

  _splitIntoPassages(rawMarkdown, sourceFile) {
    // Split on markdown headings (## or #) to keep passages topical.
    const lines = rawMarkdown.split(/\r?\n/);
    const passages = [];
    let currentHeading = 'Introduction';
    let buffer = [];

    const flush = () => {
      const text = buffer.join('\n').trim();
      if (text.length > 0) {
        passages.push({
          source: sourceFile,
          heading: currentHeading,
          text: text.slice(0, MAX_PASSAGE_CHARS),
        });
      }
      buffer = [];
    };

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.*)/);
      if (headingMatch) {
        flush();
        currentHeading = headingMatch[1].trim();
      } else {
        buffer.push(line);
      }
    }
    flush();
    return passages;
  }

  /**
   * Deterministic keyword scoring: counts overlapping normalized tokens
   * between the query and each passage (heading gets a weight bonus).
   */
  _scorePassage(queryTokens, passage) {
    const passageTokens = this._tokenize(`${passage.heading} ${passage.text}`);
    const headingTokens = this._tokenize(passage.heading);
    let score = 0;
    for (const token of queryTokens) {
      if (passageTokens.includes(token)) score += 1;
      if (headingTokens.includes(token)) score += 2; // heading matches weighted higher
    }
    return score;
  }

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  /**
   * search
   * Returns up to MAX_PASSAGES_RETURNED relevant passages for a query,
   * each tagged with its source file so citations stay honest.
   */
  search(query, { limit = MAX_PASSAGES_RETURNED } = {}) {
    this.loadDocuments();
    const queryTokens = this._tokenize(query || '');
    if (queryTokens.length === 0) return [];

    const scored = [];
    for (const doc of this.documents) {
      for (const passage of doc.passages) {
        const score = this._scorePassage(queryTokens, passage);
        if (score > 0) {
          scored.push({ ...passage, score });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}

module.exports = { RagEngine, MAX_PASSAGE_CHARS };
