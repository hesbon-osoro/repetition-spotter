// enhanced-analysis-functions.js

class EnhancedTextAnalysis {
  constructor() {
    this.settings = {
      minLength: 3,
      similarityThreshold: 80,
      semanticSimilarity: true,
      ignoreCase: true,
      ignorePunctuation: false,
      detectSequences: true,
    };
  }

  // Enhanced paragraph detection with multi-paragraph sequences
  async findParagraphRepetitions(text) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const repetitions = [];
    const seen = new Map();

    // Single paragraphs
    paragraphs.forEach((paragraph, index) => {
      const normalized = this.normalizeText(paragraph);
      if (normalized.length > 50) {
        const key = `single_${normalized}`;
        if (seen.has(key)) {
          seen.get(key).push({ index, originalText: paragraph.trim() });
        } else {
          seen.set(key, [{ index, originalText: paragraph.trim() }]);
        }
      }
    });

    // Multi-paragraph sequences (2-5 consecutive paragraphs)
    for (let len = 2; len <= Math.min(5, paragraphs.length); len++) {
      for (let i = 0; i <= paragraphs.length - len; i++) {
        const combination = paragraphs
          .slice(i, i + len)
          .map(p => p.trim())
          .join('\n\n');
        const normalized = this.normalizeText(combination);

        if (normalized.length > 100) {
          const key = `multi_${len}_${normalized}`;
          if (seen.has(key)) {
            seen.get(key).push({ index: i, originalText: combination });
          } else {
            seen.set(key, [{ index: i, originalText: combination }]);
          }
        }
      }
    }

    seen.forEach((matches, content) => {
      if (matches.length > 1) {
        const isMulti = content.startsWith('multi_');
        const paragraphCount = isMulti ? parseInt(content.split('_')[1]) : 1;
        const originalText = matches[0].originalText;

        repetitions.push({
          text: this.truncateText(originalText, 150),
          fullText: originalText,
          count: matches.length,
          level: 'paragraph',
          paragraphCount: paragraphCount,
          indices: matches.map(m => m.index),
          matches: matches,
          severity: this.calculateSeverity(matches.length, originalText.length),
        });
      }
    });

    return repetitions.sort((a, b) => b.severity - a.severity);
  }

  // Enhanced sentence detection
  async findSentenceRepetitions(text) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const repetitions = [];
    const seen = new Map();

    sentences.forEach((sentence, index) => {
      const normalized = this.normalizeText(sentence);
      if (normalized.length > 20) {
        if (seen.has(normalized)) {
          seen.get(normalized).push({ index, originalText: sentence.trim() });
        } else {
          seen.set(normalized, [{ index, originalText: sentence.trim() }]);
        }
      }
    });

    seen.forEach((matches, sentence) => {
      if (matches.length > 1) {
        const originalText = matches[0].originalText;
        repetitions.push({
          text: this.truncateText(originalText, 100),
          fullText: originalText,
          count: matches.length,
          level: 'sentence',
          indices: matches.map(m => m.index),
          matches: matches,
          severity: this.calculateSeverity(matches.length, originalText.length),
        });
      }
    });

    return repetitions.sort((a, b) => b.severity - a.severity);
  }

  // Enhanced phrase detection with dynamic length
  async findPhraseRepetitions(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const repetitions = [];
    const seen = new Map();

    // Dynamic phrase length based on text size
    const maxPhraseLength = Math.min(15, Math.floor(words.length / 10));

    for (let len = this.settings.minLength; len <= maxPhraseLength; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');

        if (phrase.length > 10 && !this.isCommonPhrase(phrase)) {
          if (seen.has(phrase)) {
            seen.get(phrase).push(i);
          } else {
            seen.set(phrase, [i]);
          }
        }
      }
    }

    seen.forEach((indices, phrase) => {
      if (indices.length > 1) {
        repetitions.push({
          text: this.truncateText(phrase, 80),
          fullText: phrase,
          count: indices.length,
          level: 'phrase',
          indices: indices,
          wordCount: phrase.split(' ').length,
          severity: this.calculateSeverity(indices.length, phrase.length),
        });
      }
    });

    return repetitions.sort((a, b) => b.severity - a.severity);
  }

  // Enhanced word repetition detection (supports 19+ words)
  async findWordRepetitions(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const repetitions = [];
    const seen = new Map();

    // Enhanced word sequence detection (19+ words support)
    const maxSequenceLength = Math.min(25, Math.floor(words.length / 5));

    for (let len = this.settings.minLength; len <= maxSequenceLength; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const sequence = words.slice(i, i + len).join(' ');

        if (sequence.length > 8 && !this.isCommonSequence(sequence)) {
          if (seen.has(sequence)) {
            seen.get(sequence).push(i);
          } else {
            seen.set(sequence, [i]);
          }
        }
      }
    }

    // Single word analysis for minimum length 1
    if (this.settings.minLength === 1) {
      const wordCount = {};
      words.forEach((word, index) => {
        if (word.length > 3 && !this.isCommonWord(word)) {
          if (wordCount[word]) {
            wordCount[word].push(index);
          } else {
            wordCount[word] = [index];
          }
        }
      });

      Object.entries(wordCount).forEach(([word, indices]) => {
        if (indices.length > 2) {
          seen.set(word, indices);
        }
      });
    }

    seen.forEach((indices, sequence) => {
      if (indices.length > 1) {
        repetitions.push({
          text: this.truncateText(sequence, 100),
          fullText: sequence,
          count: indices.length,
          level: 'word',
          indices: indices,
          wordCount: sequence.split(' ').length,
          severity: this.calculateSeverity(indices.length, sequence.length),
        });
      }
    });

    return repetitions.sort((a, b) => b.severity - a.severity);
  }

  // Advanced semantic matching
  async findSemanticMatches(selectedText, fullText, range) {
    const matches = [];
    const selectedWords = this.extractMeaningfulWords(selectedText);

    if (selectedWords.length === 0) return matches;

    const sentences = fullText.match(/[^\.!?]+[\.!?]+/g) || [];

    for (const sentence of sentences) {
      const sentenceStart = fullText.indexOf(sentence);

      // Skip if this overlaps with selected text
      if (
        this.rangesOverlap(
          { start: sentenceStart, end: sentenceStart + sentence.length },
          { start: range.index, end: range.index + range.length }
        )
      ) {
        continue;
      }

      const sentenceWords = this.extractMeaningfulWords(sentence);
      const similarity = await this.calculateAdvancedSimilarity(
        selectedWords,
        sentenceWords
      );

      if (similarity >= this.settings.similarityThreshold) {
        matches.push({
          index: sentenceStart,
          text: sentence.trim(),
          context: this.getContext(fullText, sentenceStart, sentence.length),
          similarity: similarity,
          isSemantic: true,
          type: 'semantic',
          matchedWords: this.findMatchedWords(selectedWords, sentenceWords),
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 8);
  }

  // Advanced similarity calculation with multiple matching strategies
  async calculateAdvancedSimilarity(words1, words2) {
    if (words1.length === 0 || words2.length === 0) return 0;

    // Exact matches
    const exactMatches = words1.filter(word => words2.includes(word)).length;

    // Partial matches (substring matching)
    let partialMatches = 0;
    words1.forEach(word1 => {
      words2.forEach(word2 => {
        if (word1 !== word2) {
          if (word1.includes(word2) || word2.includes(word1)) {
            partialMatches += 0.5;
          }
          // Levenshtein distance for similar words
          if (
            this.levenshteinDistance(word1, word2) <= 2 &&
            Math.min(word1.length, word2.length) > 4
          ) {
            partialMatches += 0.3;
          }
        }
      });
    });

    // Synonym matching
    const synonymMatches = this.findSynonymMatches(words1, words2);

    // Semantic field matching (domain-specific terms)
    const semanticMatches = this.findSemanticFieldMatches(words1, words2);

    const totalMatches =
      exactMatches + partialMatches + synonymMatches + semanticMatches;
    const maxLength = Math.max(words1.length, words2.length);

    return Math.min(100, Math.round((totalMatches / maxLength) * 100));
  }

  // Synonym matching using predefined groups
  findSynonymMatches(words1, words2) {
    const synonymGroups = [
      ['big', 'large', 'huge', 'massive', 'enormous', 'gigantic'],
      ['small', 'tiny', 'little', 'mini', 'minute', 'petite'],
      ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'],
      ['bad', 'terrible', 'awful', 'horrible', 'dreadful', 'poor'],
      ['fast', 'quick', 'rapid', 'speedy', 'swift', 'hasty'],
      ['slow', 'sluggish', 'gradual', 'leisurely', 'unhurried'],
      ['smart', 'intelligent', 'clever', 'brilliant', 'wise', 'bright'],
      ['easy', 'simple', 'straightforward', 'effortless', 'uncomplicated'],
      ['hard', 'difficult', 'challenging', 'tough', 'complex', 'complicated'],
      ['beautiful', 'gorgeous', 'stunning', 'attractive', 'lovely', 'pretty'],
      ['machine', 'device', 'apparatus', 'equipment', 'instrument', 'tool'],
      ['method', 'approach', 'technique', 'strategy', 'procedure', 'way'],
      [
        'analysis',
        'examination',
        'study',
        'investigation',
        'research',
        'review',
      ],
      ['component', 'element', 'part', 'module', 'section', 'piece'],
      ['application', 'program', 'software', 'tool', 'system', 'platform'],
      ['create', 'make', 'build', 'construct', 'develop', 'generate'],
      ['important', 'significant', 'crucial', 'vital', 'essential', 'critical'],
      ['problem', 'issue', 'challenge', 'difficulty', 'obstacle', 'concern'],
    ];

    let matches = 0;
    words1.forEach(word1 => {
      words2.forEach(word2 => {
        synonymGroups.forEach(group => {
          if (
            group.includes(word1) &&
            group.includes(word2) &&
            word1 !== word2
          ) {
            matches += 0.8;
          }
        });
      });
    });

    return matches;
  }

  // Semantic field matching for domain-specific terms
  findSemanticFieldMatches(words1, words2) {
    const semanticFields = {
      technology: [
        'computer',
        'software',
        'algorithm',
        'data',
        'digital',
        'code',
        'programming',
        'system',
        'network',
        'database',
      ],
      business: [
        'company',
        'market',
        'customer',
        'profit',
        'revenue',
        'strategy',
        'management',
        'organization',
        'corporate',
        'enterprise',
      ],
      science: [
        'research',
        'experiment',
        'hypothesis',
        'theory',
        'analysis',
        'methodology',
        'observation',
        'conclusion',
        'evidence',
        'study',
      ],
      education: [
        'student',
        'teacher',
        'learning',
        'knowledge',
        'curriculum',
        'academic',
        'university',
        'education',
        'training',
        'instruction',
      ],
      health: [
        'medical',
        'patient',
        'treatment',
        'diagnosis',
        'therapy',
        'healthcare',
        'clinical',
        'hospital',
        'medicine',
        'wellness',
      ],
    };

    let matches = 0;
    Object.values(semanticFields).forEach(field => {
      const field1Count = words1.filter(word => field.includes(word)).length;
      const field2Count = words2.filter(word => field.includes(word)).length;
      if (field1Count > 0 && field2Count > 0) {
        matches += Math.min(field1Count, field2Count) * 0.4;
      }
    });

    return matches;
  }

  // Utility methods
  normalizeText(text) {
    let normalized = text.trim().toLowerCase();
    if (this.settings.ignorePunctuation) {
      normalized = normalized.replace(/[^\w\s]/g, '');
    }
    return normalized.replace(/\s+/g, ' ');
  }

  truncateText(text, maxLength) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  calculateSeverity(count, textLength) {
    const lengthFactor = Math.min(textLength / 100, 2);
    const countFactor = Math.min(count / 5, 3);
    return Math.round(countFactor * lengthFactor * 100);
  }

  extractMeaningfulWords(text) {
    return (
      text
        .toLowerCase()
        .match(/\b\w+\b/g)
        ?.filter(word => word.length > 3 && !this.isCommonWord(word)) || []
    );
  }

  findMatchedWords(words1, words2) {
    return words1.filter(word => words2.includes(word));
  }

  rangesOverlap(range1, range2) {
    return range1.start < range2.end && range2.start < range1.end;
  }

  deduplicateMatches(matches) {
    return matches.filter(
      (match, index, self) =>
        self.findIndex(m => Math.abs(m.index - match.index) < 10) === index
    );
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  determineSelectionLevel(text) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];

    if (paragraphs.length > 1) return 'paragraph';
    if (sentences.length >= 1) return 'sentence';
    if (words.length > 5) return 'phrase';
    return 'word';
  }

  getContext(fullText, index, length) {
    const start = Math.max(0, index - 60);
    const end = Math.min(fullText.length, index + length + 60);
    const context = fullText.substring(start, end);
    return (
      (start > 0 ? '...' : '') + context + (end < fullText.length ? '...' : '')
    );
  }

  isCommonWord(word) {
    const commonWords = new Set([
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'had',
      'her',
      'was',
      'one',
      'our',
      'out',
      'day',
      'get',
      'has',
      'him',
      'his',
      'how',
      'its',
      'may',
      'new',
      'now',
      'old',
      'see',
      'two',
      'who',
      'boy',
      'did',
      'she',
      'use',
      'way',
      'will',
      'with',
      'have',
      'this',
      'that',
      'from',
      'they',
      'know',
      'want',
      'been',
      'good',
      'much',
      'some',
      'time',
      'very',
      'when',
      'come',
      'here',
      'just',
      'like',
      'long',
      'make',
      'many',
      'over',
      'such',
      'take',
      'than',
      'them',
      'well',
      'were',
      'what',
      'your',
    ]);
    return commonWords.has(word.toLowerCase());
  }

  isCommonPhrase(phrase) {
    const commonPhrases = [
      'in the',
      'of the',
      'to the',
      'and the',
      'for the',
      'on the',
      'at the',
      'by the',
      'with the',
      'from the',
      'this is',
      'that is',
      'it is',
      'there is',
      'there are',
      'you can',
      'we can',
      'i can',
      'will be',
      'would be',
      'could be',
      'should be',
      'have been',
      'has been',
    ];
    return commonPhrases.some(common => phrase.includes(common));
  }

  isCommonSequence(sequence) {
    const words = sequence.split(' ');
    return words.length < 3 || words.every(word => this.isCommonWord(word));
  }

  getStatistics(text, repetitions) {
    const words = text.match(/\b\w+\b/g) || [];
    const totalInstances = repetitions.reduce((sum, rep) => sum + rep.count, 0);
    const uniqueWords = Math.max(0, words.length - totalInstances);
    const efficiency =
      words.length > 0 ? Math.round((uniqueWords / words.length) * 100) : 100;

    return {
      wordCount: words.length,
      repetitionCount: repetitions.length,
      instanceCount: totalInstances,
      uniqueWords: uniqueWords,
      efficiency: efficiency,
      averageSeverity:
        repetitions.length > 0
          ? Math.round(
              repetitions.reduce((sum, rep) => sum + (rep.severity || 0), 0) /
                repetitions.length
            )
          : 0,
    };
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// Enhanced highlighting functionality
class EnhancedHighlighting {
  constructor(quillInstance) {
    this.quillInstance = quillInstance;
    this.currentHighlights = [];
  }

  highlightRepetition(repetition) {
    if (!this.quillInstance) {
      console.warn('Quill instance not available for highlighting');
      return;
    }

    try {
      this.clearHighlights();

      const fullText = this.quillInstance.getText();
      const searchText = repetition.fullText || repetition.text;

      if (!searchText || searchText.trim().length === 0) {
        console.warn('No search text provided for highlighting');
        return;
      }

      // Create regex with proper escaping
      const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedText, 'gi');

      let match;
      let firstMatchIndex = -1;
      let matchCount = 0;
      const highlights = [];

      // Reset regex lastIndex to ensure we find all matches
      regex.lastIndex = 0;

      while ((match = regex.exec(fullText)) !== null && matchCount < 50) {
        const startIndex = match.index;
        const length = match[0].length;

        // Different colors for first match vs others
        const backgroundColor = matchCount === 0 ? '#28a745' : '#ffc107';
        const textColor = matchCount === 0 ? 'white' : 'black';

        // Apply formatting
        this.quillInstance.formatText(startIndex, length, {
          background: backgroundColor,
          color: textColor,
        });

        highlights.push({ index: startIndex, length, color: backgroundColor });

        if (firstMatchIndex === -1) {
          firstMatchIndex = startIndex;
        }
        matchCount++;

        // Prevent infinite loop
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      this.currentHighlights = highlights;

      console.log(
        `Highlighted ${matchCount} matches for: "${searchText.substring(0, 50)}..."`
      );

      // Scroll to and select first match
      if (firstMatchIndex !== -1) {
        this.quillInstance.setSelection(
          firstMatchIndex,
          Math.min(searchText.length, 200)
        );
        this.quillInstance.focus();

        // Scroll into view
        setTimeout(() => {
          try {
            const selection = this.quillInstance.getSelection();
            if (selection) {
              const bounds = this.quillInstance.getBounds(selection.index);
              const editorElement =
                this.quillInstance.container.querySelector('.ql-editor');
              if (editorElement && bounds) {
                editorElement.scrollTop = Math.max(0, bounds.top - 100);
              }
            }
          } catch (scrollError) {
            console.warn('Scroll error:', scrollError);
          }
        }, 150);
      }
    } catch (error) {
      console.error('Highlighting error:', error);
    }
  }

  highlightSelectionMatches(selectionAnalysis) {
    if (!this.quillInstance || !selectionAnalysis) {
      console.warn('Quill instance or selection analysis not available');
      return;
    }

    try {
      this.clearHighlights();

      const fullText = this.quillInstance.getText();

      // Highlight original selection first
      const range = selectionAnalysis.range;
      if (range && range.index >= 0 && range.length > 0) {
        this.quillInstance.formatText(range.index, range.length, {
          background: '#007acc',
          color: 'white',
        });
      }

      // Highlight matches
      if (selectionAnalysis.matches && selectionAnalysis.matches.length > 0) {
        selectionAnalysis.matches.forEach((match, index) => {
          if (match.index >= 0 && match.text && match.text.length > 0) {
            const color = match.isSemantic ? '#8b5cf6' : '#10b981';
            const textColor = 'white';

            this.quillInstance.formatText(match.index, match.text.length, {
              background: color,
              color: textColor,
            });
          }
        });

        console.log(
          `Highlighted selection and ${selectionAnalysis.matches.length} matches`
        );
      }

      // Focus and scroll to original selection
      if (range && range.index >= 0) {
        this.quillInstance.setSelection(range.index, range.length);
        this.quillInstance.focus();
      }
    } catch (error) {
      console.error('Selection highlighting error:', error);
    }
  }

  clearHighlights() {
    if (!this.quillInstance) return;

    try {
      const length = this.quillInstance.getLength();
      this.quillInstance.formatText(0, length, {
        background: false,
        color: false,
      });
      this.currentHighlights = [];
    } catch (error) {
      console.error('Clear highlights error:', error);
    }
  }
}

// Export for use in fallback module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedTextAnalysis, EnhancedHighlighting };
} else {
  window.EnhancedTextAnalysis = EnhancedTextAnalysis;
  window.EnhancedHighlighting = EnhancedHighlighting;
}
