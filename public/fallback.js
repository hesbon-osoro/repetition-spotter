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

// Configuration
const FALLBACK_CONFIG = {
  toolbarOptions: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ['clean'],
  ],
  placeholder: 'Paste your text here for VSCode-style repetition analysis...',
  sampleText: [
    {
      insert:
        'Welcome to RepetitionSpotter, the advanced text analysis tool. This tool helps you identify repeated content in your writing. The tool uses sophisticated algorithms to detect repetitions at multiple levels.\n\n',
    },
    {
      insert:
        'The analysis tool works by examining your text for repeated sequences. The tool can detect paragraphs, sentences, phrases, and individual words that appear multiple times. This makes the tool particularly useful for academic writing.\n\n',
    },
    {
      insert:
        'To get started with the tool, simply paste your text into the editor above. The tool will automatically analyze your content and highlight any repetitions it finds. You can adjust the detection level to focus on different types of repetitions.\n\n',
    },
    {
      insert:
        'Welcome to RepetitionSpotter, the advanced text analysis tool. This tool helps you identify repeated content in your writing. The tool uses sophisticated algorithms to detect repetitions at multiple levels.\n\n',
    },
    {
      insert:
        'The analysis tool works by examining your text for repeated sequences. The tool can detect paragraphs, sentences, phrases, and individual words that appear multiple times. This makes the tool particularly useful for academic writing.\n\n',
    },
    {
      insert:
        'To get started with the tool, simply paste your text into the editor above. The tool will automatically analyze your content and highlight any repetitions it finds. You can adjust the detection level to focus on different types of repetitions.\n\n',
    },
    {
      insert:
        'Welcome to RepetitionSpotter, the advanced text analysis tool. This tool helps you identify repeated content in your writing. The tool uses sophisticated algorithms to detect repetitions at multiple levels.\n\n',
    },
    {
      insert:
        'The analysis tool works by examining your text for repeated sequences. The tool can detect paragraphs, sentences, phrases, and individual words that appear multiple times. This makes the tool particularly useful for academic writing.\n\n',
    },
    {
      insert:
        'To get started with the tool, simply paste your text into the editor above. The tool will automatically analyze your content and highlight any repetitions it finds. You can adjust the detection level to focus on different types of repetitions.',
    },
  ],
};

// Core functionality
class RepetitionSpotterFallback {
  constructor() {
    this.quill = null;
    this.currentLevel = 'paragraph';
    this.repetitions = [];
    this.chart = null;
    this.isInitialized = false;
  }

  // Initialize the fallback module
  init() {
    if (this.isInitialized) return;

    try {
      this.initializeEditor();
      this.initializeChart();
      this.setupEventListeners();
      this.isInitialized = true;

      // Auto-analyze after initialization
      setTimeout(() => {
        this.analyzeText();
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize RepetitionSpotter fallback:', error);
      throw error;
    }
  }

  // Initialize Quill editor
  initializeEditor() {
    if (typeof Quill === 'undefined') {
      throw new Error(
        'Quill.js is not loaded. Please include Quill.js before initializing the fallback.'
      );
    }

    this.quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: FALLBACK_CONFIG.toolbarOptions,
      },
      placeholder: FALLBACK_CONFIG.placeholder,
    });

    // Set sample text
    this.quill.setContents(FALLBACK_CONFIG.sampleText);

    // Setup selection handling
    this.quill.on('selection-change', (range, oldRange, source) => {
      this.handleSelectionChange(range, oldRange, source);
    });
  }

  // Initialize Chart.js
  initializeChart() {
    if (typeof Chart === 'undefined') {
      console.warn(
        'Chart.js is not loaded. Chart functionality will be disabled.'
      );
      return;
    }

    const ctx = document.getElementById('repetitionChart')?.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Unique Content', 'Repetitions'],
        datasets: [
          {
            data: [100, 0],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Slider events
    const minLengthSlider = document.getElementById('minLengthSlider');
    const similaritySlider = document.getElementById('similaritySlider');

    if (minLengthSlider) {
      minLengthSlider.addEventListener('input', e => {
        document.getElementById('minLengthValue').textContent = e.target.value;
        if (this.quill.getText().trim().length > 0) {
          this.analyzeText();
        }
      });
    }

    if (similaritySlider) {
      similaritySlider.addEventListener('input', e => {
        document.getElementById('similarityValue').textContent = e.target.value;
        if (this.quill.getText().trim().length > 0) {
          this.analyzeText();
        }
      });
    }

    // Button events
    this.attachEvent('analyzeText', 'click', () => this.analyzeText());
    this.attachEvent('clearText', 'click', () => this.clearText());
    this.attachEvent('clearHighlights', 'click', () => this.clearHighlights());
    this.attachEvent('searchRepetitions', 'input', e =>
      this.filterRepetitions(e.target.value)
    );

    // Advanced options
    this.attachEvent('semanticSimilarity', 'change', () => {
      if (this.quill.getText().trim().length > 0) this.analyzeText();
    });
    this.attachEvent('ignoreCase', 'change', () => {
      if (this.quill.getText().trim().length > 0) this.analyzeText();
    });
    this.attachEvent('ignorePunctuation', 'change', () => {
      if (this.quill.getText().trim().length > 0) this.analyzeText();
    });
  }

  attachEvent(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(eventType, handler);
    }
  }

  // Detection level management
  setDetectionLevel(level) {
    this.currentLevel = level;

    // Update button states
    document.querySelectorAll('.detection-level-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-level="${level}"]`)?.classList.add('active');

    // Re-analyze if there's content
    if (this.quill.getText().trim().length > 0) {
      this.analyzeText();
    }
  }

  // Main analysis function
  analyzeText() {
    const text = this.quill.getText();
    if (!text.trim()) return;

    this.clearHighlights();

    switch (this.currentLevel) {
      case 'paragraph':
        this.repetitions = this.findParagraphRepetitions(text);
        break;
      case 'sentence':
        this.repetitions = this.findSentenceRepetitions(text);
        break;
      case 'phrase':
        this.repetitions = this.findPhraseRepetitions(text);
        break;
      case 'word':
        this.repetitions = this.findWordRepetitions(text);
        break;
    }

    this.updateStatistics(text, this.repetitions);
    this.displayRepetitions(this.repetitions);
    this.updateChart(text, this.repetitions);
  }

  // Text analysis algorithms
  findParagraphRepetitions(text) {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const repetitions = [];
    const seen = new Map();

    // Single paragraph repetitions
    paragraphs.forEach((paragraph, index) => {
      const normalized = paragraph.trim().toLowerCase();
      if (normalized.length > 50) {
        if (seen.has(normalized)) {
          seen.get(normalized).push({
            index: index,
            originalText: paragraph.trim(),
          });
        } else {
          seen.set(normalized, [
            {
              index: index,
              originalText: paragraph.trim(),
            },
          ]);
        }
      }
    });

    // Multi-paragraph combinations (2-5 consecutive paragraphs)
    for (let len = 2; len <= Math.min(5, paragraphs.length); len++) {
      for (let i = 0; i <= paragraphs.length - len; i++) {
        const combination = paragraphs
          .slice(i, i + len)
          .map(p => p.trim())
          .join('\n\n');
        const normalizedCombination = combination.toLowerCase();

        if (normalizedCombination.length > 100) {
          const key = `multi_${len}_${normalizedCombination}`;
          if (seen.has(key)) {
            seen.get(key).push({
              index: i,
              originalText: combination,
            });
          } else {
            seen.set(key, [
              {
                index: i,
                originalText: combination,
              },
            ]);
          }
        }
      }
    }

    seen.forEach((matches, content) => {
      if (matches.length > 1) {
        const isMulti = content.startsWith('multi_');
        const actualContent = isMulti
          ? content.substring(content.indexOf('_', 6) + 1)
          : content;
        const paragraphCount = isMulti ? parseInt(content.split('_')[1]) : 1;
        const originalText = matches[0].originalText;

        repetitions.push({
          text:
            originalText.substring(0, 150) +
            (originalText.length > 150 ? '...' : ''),
          fullText: originalText,
          count: matches.length,
          level: 'paragraph',
          paragraphCount: paragraphCount,
          indices: matches.map(m => m.index),
          matches: matches,
        });
      }
    });

    return repetitions.sort((a, b) => b.count - a.count);
  }

  findSentenceRepetitions(text) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const repetitions = [];
    const seen = new Map();

    sentences.forEach((sentence, index) => {
      const normalized = sentence.trim().toLowerCase();
      if (normalized.length > 20) {
        if (seen.has(normalized)) {
          seen.get(normalized).push(index);
        } else {
          seen.set(normalized, [index]);
        }
      }
    });

    seen.forEach((indices, sentence) => {
      if (indices.length > 1) {
        repetitions.push({
          text: sentence.trim(),
          fullText: sentence.trim(),
          count: indices.length,
          level: 'sentence',
          indices: indices,
        });
      }
    });

    return repetitions.sort((a, b) => b.count - a.count);
  }

  findPhraseRepetitions(text) {
    const minLength = parseInt(
      document.getElementById('minLengthSlider')?.value || '3'
    );
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const repetitions = [];
    const seen = new Map();

    for (let len = minLength; len <= Math.min(10, words.length); len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (seen.has(phrase)) {
          seen.get(phrase).push(i);
        } else {
          seen.set(phrase, [i]);
        }
      }
    }

    seen.forEach((indices, phrase) => {
      if (indices.length > 1) {
        repetitions.push({
          text: phrase,
          fullText: phrase,
          count: indices.length,
          level: 'phrase',
          indices: indices,
        });
      }
    });

    return repetitions.sort((a, b) => b.count - a.count);
  }

  findWordRepetitions(text) {
    const minLength = parseInt(
      document.getElementById('minLengthSlider')?.value || '3'
    );
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const repetitions = [];
    const seen = new Map();

    // Find sequences of words based on minimum length setting
    for (let len = minLength; len <= Math.min(20, words.length); len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const sequence = words.slice(i, i + len).join(' ');

        // Only consider sequences with substantial content
        if (sequence.length > 10) {
          if (seen.has(sequence)) {
            seen.get(sequence).push(i);
          } else {
            seen.set(sequence, [i]);
          }
        }
      }
    }

    // Also include single words if minimum length is 1
    if (minLength === 1) {
      const wordCount = {};
      words.forEach((word, index) => {
        if (word.length > 3) {
          if (wordCount[word]) {
            wordCount[word].push(index);
          } else {
            wordCount[word] = [index];
          }
        }
      });

      Object.entries(wordCount).forEach(([word, indices]) => {
        if (indices.length > 1) {
          seen.set(word, indices);
        }
      });
    }

    seen.forEach((indices, sequence) => {
      if (indices.length > 1) {
        repetitions.push({
          text:
            sequence.length > 100
              ? sequence.substring(0, 100) + '...'
              : sequence,
          fullText: sequence,
          count: indices.length,
          level: 'word',
          indices: indices,
          wordCount: sequence.split(' ').length,
        });
      }
    });

    return repetitions.sort((a, b) => b.count - a.count);
  }

  // Selection handling
  handleSelectionChange(range, oldRange, source) {
    if (range && range.length > 0) {
      const selectedText = this.quill.getText(range.index, range.length).trim();
      if (selectedText.length > 0) {
        this.highlightSimilarText(selectedText, range);
        this.findAndDisplaySelectionRepetitions(selectedText, range);
        this.showSelectionInfo(selectedText, range);
      }
    } else {
      this.clearSelectionHighlights();
      this.hideSelectionInfo();
      this.displayRepetitions(this.repetitions);
    }
  }

  highlightSimilarText(selectedText, range) {
    this.clearSelectionHighlights();

    const fullText = this.quill.getText();
    const regex = new RegExp(this.escapeRegExp(selectedText), 'gi');
    let match;

    // First highlight the selection itself
    this.quill.formatText(range.index, range.length, 'background', '#add8e6');

    // Then highlight all matches
    while ((match = regex.exec(fullText)) !== null) {
      if (match.index !== range.index) {
        this.quill.formatText(
          match.index,
          match[0].length,
          'background',
          '#ffeb3b'
        );
      }
    }
  }

  findAndDisplaySelectionRepetitions(selectedText, range) {
    const fullText = this.quill.getText();
    const ignoreCase = document.getElementById('ignoreCase')?.checked || true;
    const ignorePunctuation =
      document.getElementById('ignorePunctuation')?.checked || false;
    const semanticSimilarity =
      document.getElementById('semanticSimilarity')?.checked || false;

    let processedText = selectedText;
    if (ignorePunctuation) {
      processedText = processedText.replace(/[^\w\s]/g, '');
    }

    const flags = ignoreCase ? 'gi' : 'g';
    const regex = new RegExp(this.escapeRegExp(processedText), flags);
    const matches = [];
    let match;

    let searchText = fullText;
    if (ignorePunctuation) {
      searchText = fullText.replace(/[^\w\s]/g, '');
    }

    while ((match = regex.exec(searchText)) !== null) {
      const originalIndex = this.findOriginalIndex(
        fullText,
        match.index,
        ignorePunctuation
      );
      if (originalIndex !== range.index) {
        matches.push({
          index: originalIndex,
          text: match[0],
          context: this.getContext(fullText, originalIndex, match[0].length),
          similarity: this.calculateSimilarity(selectedText, match[0]),
        });
      }
    }

    // Add semantic similarity matches if enabled
    if (semanticSimilarity && matches.length < 10) {
      const semanticMatches = this.findSemanticMatches(
        selectedText,
        fullText,
        range
      );
      matches.push(...semanticMatches);
    }

    if (matches.length > 0) {
      const selectionRepetition = {
        text:
          selectedText.length > 100
            ? selectedText.substring(0, 100) + '...'
            : selectedText,
        fullText: selectedText,
        count: matches.length + 1,
        level: this.determineSelectionLevel(selectedText),
        matches: matches,
        isSelection: true,
        range: range,
      };

      this.displaySelectionRepetitions([selectionRepetition]);
    } else {
      this.displaySelectionRepetitions([]);
    }
  }

  findOriginalIndex(fullText, processedIndex, ignorePunctuation) {
    if (!ignorePunctuation) return processedIndex;

    let originalIndex = 0;
    let processedCount = 0;

    for (
      let i = 0;
      i < fullText.length && processedCount < processedIndex;
      i++
    ) {
      if (!/[^\w\s]/.test(fullText[i])) {
        processedCount++;
      }
      originalIndex = i + 1;
    }

    return originalIndex;
  }

  findSemanticMatches(selectedText, fullText, range) {
    const matches = [];
    const words = selectedText.toLowerCase().split(/\s+/);
    const sentences = fullText.match(/[^\.!?]+[\.!?]+/g) || [];

    sentences.forEach((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const commonWords = words.filter(
        word =>
          word.length > 3 &&
          sentenceWords.some(sw => sw.includes(word) || word.includes(sw))
      );

      if (commonWords.length >= Math.min(3, words.length * 0.6)) {
        const sentenceStart = fullText.indexOf(sentence);
        if (
          sentenceStart !== -1 &&
          (sentenceStart < range.index ||
            sentenceStart >= range.index + range.length)
        ) {
          matches.push({
            index: sentenceStart,
            text: sentence.trim(),
            context: this.getContext(fullText, sentenceStart, sentence.length),
            similarity: (commonWords.length / words.length) * 100,
            isSemantic: true,
          });
        }
      }
    });

    return matches.slice(0, 5);
  }

  calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return Math.round(
      (commonWords.length / Math.max(words1.length, words2.length)) * 100
    );
  }

  showSelectionInfo(selectedText, range) {
    const info = document.getElementById('selectionInfo');
    const textElement = document.getElementById('selectionText');

    if (!info || !textElement) return;

    const wordCount = selectedText.split(/\s+/).length;
    const charCount = selectedText.length;
    const level = this.determineSelectionLevel(selectedText);

    textElement.textContent = `Selected: ${wordCount} words, ${charCount} characters (${level} level)`;
    info.classList.remove('hidden');
  }

  hideSelectionInfo() {
    const info = document.getElementById('selectionInfo');
    if (info) info.classList.add('hidden');
  }

  determineSelectionLevel(text) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];

    if (paragraphs.length > 1) return 'paragraph';
    if (sentences.length >= 1) return 'sentence';
    if (words.length > 5) return 'phrase';
    return 'word';
  }

  getContext(fullText, index, length) {
    const start = Math.max(0, index - 50);
    const end = Math.min(fullText.length, index + length + 50);
    const context = fullText.substring(start, end);
    return (
      (start > 0 ? '...' : '') + context + (end < fullText.length ? '...' : '')
    );
  }

  displaySelectionRepetitions(selectionReps) {
    const container = document.getElementById('repetitionsList');
    if (!container) return;

    if (selectionReps.length === 0) {
      container.innerHTML = `
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-blue-800 font-medium">Selection Analysis</p>
            </div>
            <p class="text-xs text-blue-600 mt-1">No repetitions found for selected text</p>
          </div>
        `;
      return;
    }

    const rep = selectionReps[0];
    const exactMatches = rep.matches.filter(m => !m.isSemantic);
    const semanticMatches = rep.matches.filter(m => m.isSemantic);

    container.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-green-800 font-medium">Selection Analysis</p>
            </div>
            <span class="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">${rep.count} total</span>
          </div>
          <p class="text-sm text-green-700 mb-2">"${rep.text}"</p>
          <div class="flex items-center space-x-4 text-xs text-green-600">
            <span class="capitalize">${rep.level} level</span>
            ${exactMatches.length > 0 ? `<span>${exactMatches.length} exact</span>` : ''}
            ${semanticMatches.length > 0 ? `<span>${semanticMatches.length} similar</span>` : ''}
          </div>
        </div>
        
        <div class="space-y-2">
          ${
            exactMatches.length > 0
              ? `
            <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Exact Matches (${exactMatches.length})
            </h4>
            ${exactMatches
              .map(
                (match, index) => `
              <div class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                   onclick="window.repetitionSpotter.scrollToMatch(${match.index}, ${match.text.length})">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-gray-500">Match ${index + 1}</span>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">${match.similarity || 100}%</span>
                    <span class="text-xs text-gray-400">Pos ${match.index}</span>
                  </div>
                </div>
                <p class="text-xs text-gray-600 italic">${match.context}</p>
              </div>
            `
              )
              .join('')}
          `
              : ''
          }
          
          ${
            semanticMatches.length > 0
              ? `
            <h4 class="text-sm font-medium text-gray-700 mb-2 mt-4 flex items-center">
              <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Similar Content (${semanticMatches.length})
            </h4>
            ${semanticMatches
              .map(
                (match, index) => `
              <div class="p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                   onclick="window.repetitionSpotter.scrollToMatch(${match.index}, ${match.text.length})">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-blue-600">Similar ${index + 1}</span>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">${Math.round(match.similarity)}%</span>
                    <span class="text-xs text-blue-400">Pos ${match.index}</span>
                  </div>
                </div>
                <p class="text-xs text-blue-600 italic">${match.context}</p>
              </div>
            `
              )
              .join('')}
          `
              : ''
          }
        </div>
      `;
  }

  clearSelectionHighlights() {
    const length = this.quill.getLength();
    this.quill.formatText(0, length, 'background', false);
    this.quill.formatText(0, length, 'border', false);
  }

  // Highlighting functions
  highlightRepetition(text, level) {
    this.clearHighlights();

    const fullText = this.quill.getText();
    let matchCount = 0;
    let firstMatchIndex = -1;

    if (level === 'paragraph') {
      const paragraphs = fullText.split('\n\n');
      let currentIndex = 0;

      paragraphs.forEach((paragraph, index) => {
        const normalizedParagraph = paragraph.trim().toLowerCase();
        const normalizedText = text.trim().toLowerCase();

        if (normalizedParagraph === normalizedText) {
          const startIndex = currentIndex;
          const endIndex = currentIndex + paragraph.length;

          this.quill.formatText(
            startIndex,
            paragraph.length,
            'background',
            this.getColorForLevel(level)
          );

          if (matchCount === 0) {
            this.quill.formatText(
              startIndex,
              paragraph.length,
              'border',
              '2px solid #dc3545'
            );
          } else {
            this.quill.formatText(
              startIndex,
              paragraph.length,
              'border',
              '2px dashed #dc3545'
            );
          }

          if (firstMatchIndex === -1) {
            firstMatchIndex = startIndex;
          }
          matchCount++;
        }

        currentIndex += paragraph.length + 2;
      });
    } else {
      const regex = new RegExp(this.escapeRegExp(text), 'gi');
      let match;

      while ((match = regex.exec(fullText)) !== null) {
        const startIndex = match.index;
        const length = match[0].length;

        this.quill.formatText(
          startIndex,
          length,
          'background',
          this.getColorForLevel(level)
        );

        if (matchCount === 0) {
          this.quill.formatText(
            startIndex,
            length,
            'border',
            `2px solid ${this.getBorderColorForLevel(level)}`
          );
        } else {
          this.quill.formatText(
            startIndex,
            length,
            'border',
            `2px dashed ${this.getBorderColorForLevel(level)}`
          );
        }

        if (firstMatchIndex === -1) {
          firstMatchIndex = startIndex;
        }
        matchCount++;
      }
    }

    if (firstMatchIndex !== -1) {
      this.quill.setSelection(firstMatchIndex, Math.min(text.length, 100));
      this.quill.focus();
    }
  }

  getColorForLevel(level) {
    const colors = {
      paragraph: '#ffcdd2',
      sentence: '#fff3e0',
      phrase: '#e8f5e8',
      word: '#e3f2fd',
    };
    return colors[level] || '#f5f5f5';
  }

  getBorderColorForLevel(level) {
    const colors = {
      paragraph: '#dc3545',
      sentence: '#ffc107',
      phrase: '#28a745',
      word: '#007bff',
    };
    return colors[level] || '#6c757d';
  }

  clearHighlights() {
    const length = this.quill.getLength();
    this.quill.formatText(0, length, 'background', false);
    this.quill.formatText(0, length, 'border', false);
  }

  clearText() {
    this.quill.setText('');
    this.repetitions = [];
    this.updateStatistics('', []);
    this.displayRepetitions([]);
    this.updateChart('', []);
  }

  // Statistics and display
  updateStatistics(text, repetitions) {
    const words = text.match(/\b\w+\b/g) || [];
    const totalInstances = repetitions.reduce((sum, rep) => sum + rep.count, 0);
    const efficiency = Math.max(0, 100 - (totalInstances / words.length) * 100);

    this.updateElementText('wordCount', words.length);
    this.updateElementText('repetitionCount', repetitions.length);
    this.updateElementText('instanceCount', totalInstances);
    this.updateElementText('efficiencyScore', Math.round(efficiency) + '%');
  }

  updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
  }

  scrollToMatch(index, length) {
    this.quill.setSelection(index, length);
    this.quill.focus();
  }

  displayRepetitions(repetitions) {
    const container = document.getElementById('repetitionsList');
    if (!container) return;

    if (repetitions.length === 0) {
      container.innerHTML = `
          <div class="text-center text-gray-500 py-8">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm">No repetitions found!</p>
            <p class="text-xs text-gray-400 mt-1">Your text looks good</p>
          </div>
        `;
      return;
    }

    container.innerHTML = repetitions
      .map(
        (rep, index) => `
          <div class="repetition-item p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" 
               onclick="window.repetitionSpotter.highlightRepetition('${rep.fullText.replace(/'/g, "\\'")}', '${rep.level}')">
            <div class="flex items-center justify-between mb-2">
              <span class="inline-block w-4 h-4 rounded level-${rep.level}" style="background-color: ${this.getColorForLevel(rep.level)}"></span>
              <span class="text-xs font-medium text-gray-500">${rep.count} times</span>
            </div>
            <p class="text-sm font-medium text-gray-900 truncate">"${rep.text}"</p>
            <p class="text-xs text-gray-500 mt-1 capitalize">
              ${rep.level} level${rep.paragraphCount > 1 ? ` (${rep.paragraphCount} paragraphs)` : ''}${rep.wordCount > 1 ? ` (${rep.wordCount} words)` : ''}
            </p>
          </div>
        `
      )
      .join('');
  }

  filterRepetitions(searchTerm) {
    const filteredRepetitions = this.repetitions.filter(rep =>
      rep.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.displayRepetitions(filteredRepetitions);
  }

  updateChart(text, repetitions) {
    if (!this.chart) return;

    const words = text.match(/\b\w+\b/g) || [];
    const totalWords = words.length;
    const repetitionWords = repetitions.reduce((sum, rep) => {
      return sum + rep.text.split(' ').length * rep.count;
    }, 0);

    const uniqueWords = Math.max(0, totalWords - repetitionWords);

    this.chart.data.datasets[0].data = [uniqueWords, repetitionWords];
    this.chart.update();
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Cleanup method
  destroy() {
    if (this.quill) {
      this.quill.off('selection-change');
    }
    this.isInitialized = false;
  }
}

// Export for use in Next.js/TypeScript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RepetitionSpotterFallback;
} else {
  window.RepetitionSpotterFallback = RepetitionSpotterFallback;
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    window.repetitionSpotter = new RepetitionSpotterFallback();

    // Make setDetectionLevel available globally for onclick handlers
    window.setDetectionLevel = function (level) {
      window.repetitionSpotter.setDetectionLevel(level);
    };

    // Initialize when dependencies are loaded
    if (typeof Quill !== 'undefined' && typeof Chart !== 'undefined') {
      window.repetitionSpotter.init();
    } else {
      // Wait for dependencies
      const checkDependencies = setInterval(() => {
        if (typeof Quill !== 'undefined' && typeof Chart !== 'undefined') {
          clearInterval(checkDependencies);
          window.repetitionSpotter.init();
        }
      }, 100);
    }
  });
}
