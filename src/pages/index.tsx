// pages/index.tsx
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import DetectionControls from '../components/editor/DetectionControls';
import Editor from '../components/editor/Editor';
import Toolbar from '../components/editor/Toolbar';
import StatsCards from '../components/analytics/StatsCards';
import RepetitionList from '../components/analytics/RepetitionList';
import SelectionAnalysis from '@/components/analytics/SelectionAnalysis';
import Chart from '../components/analytics/Chart';
import TextStatsPanel from '../components/analytics/TextStatsPanel';
import { formatDuration } from '../utils/textStats';
import { useTextAnalysis } from '../hooks/useTextAnalysis';
import { useCallback, useEffect, useState } from 'react';

const Home: NextPage = () => {
  const {
    content,
    setContent,
    ready,
    restoredAt,
    savedAt,
    loadSample,
    currentText,
    textStats,
    statsText,
    showSpans,
    repetitions,
    stats,
    detectionLevel,
    setDetectionLevel,
    options,
    updateOption,
    analyze,
    highlightRepetition,
    focused,
    clearHighlights,
    clearText,
    quillRef,
    handleSelection,
    scrollToMatch,
    selectionAnalysis,
  } = useTextAnalysis();

  // Focus mode: just the editor. Escape leaves it.
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFocus(false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [focus]);

  const getReport = useCallback(
    () => ({
      level: detectionLevel,
      repetitions,
      stats,
      textStats,
    }),
    [detectionLevel, repetitions, stats, textStats]
  );

  return (
    <>
      <Head>
        <title>RepetitionSpotter - Professional Text Analysis Tool</title>
        <meta
          name="description"
          content="Find repeated paragraphs, sentences, phrases and words in your writing, with live word count, readability scores and keyword density. Runs in your browser."
        />
        <meta
          name="keywords"
          content="text analysis, repetition detection, word counter, character count, readability, Flesch, keyword density, writing tool, duplicate content, writing assistant"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Hesbon Osoro" />
        <meta
          property="og:title"
          content="RepetitionSpotter - Professional Text Analysis Tool"
        />
        <meta
          property="og:description"
          content="Find repetitions, count words and check readability, all in your browser."
        />
        <meta property="og:type" content="website" />
      </Head>

      <Layout focus={focus}>
        <div
          className={`mx-auto px-3 py-4 sm:px-6 lg:px-8 ${
            focus ? 'max-w-5xl' : 'max-w-7xl'
          }`}
        >
          <div
            className={`grid grid-cols-1 gap-6 lg:gap-8 ${
              focus ? '' : 'lg:grid-cols-4'
            }`}
          >
            {/* Main Editor Area */}
            <div className={`min-w-0 ${focus ? '' : 'lg:col-span-3'}`}>
              {!focus && (
                <DetectionControls
                  detectionLevel={detectionLevel}
                  setDetectionLevel={setDetectionLevel}
                  options={options}
                  updateOption={updateOption}
                />
              )}
              <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <Toolbar
                  onAnalyze={analyze}
                  onClearHighlights={clearHighlights}
                  onClearText={clearText}
                  onUpload={text => setContent(text)}
                  options={options}
                  updateOption={updateOption}
                  getText={currentText}
                  getReport={getReport}
                  focus={focus}
                  onToggleFocus={() => setFocus(f => !f)}
                  savedAt={savedAt}
                  restoredAt={restoredAt}
                  onLoadSample={loadSample}
                />
                <Editor
                  content={content}
                  onChange={setContent}
                  quillRef={quillRef}
                  onSelectionChange={handleSelection}
                  ready={ready}
                  focus={focus}
                />
                <p
                  className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line bg-surface-2 px-4 py-2 text-xs tabular-nums text-ink-2 sm:px-6"
                  aria-live="polite"
                >
                  <span>{textStats.words.toLocaleString()} words</span>
                  <span>
                    {textStats.characters.toLocaleString()} characters
                  </span>
                  <span>
                    {textStats.charactersNoSpaces.toLocaleString()} without
                    spaces
                  </span>
                  <span>{textStats.sentences.toLocaleString()} sentences</span>
                  <span>{formatDuration(textStats.readingTime)} read</span>
                </p>
              </div>
              {!focus && <StatsCards stats={stats} />}
            </div>

            {/* Sidebar */}
            {!focus && (
              <div className="min-w-0 lg:col-span-1">
                {selectionAnalysis && (
                  <SelectionAnalysis
                    analysis={selectionAnalysis}
                    onScrollToMatch={scrollToMatch}
                  />
                )}
                <RepetitionList
                  repetitions={repetitions}
                  onHighlight={highlightRepetition}
                  focused={focused}
                />
                <TextStatsPanel
                  stats={textStats}
                  onShow={showSpans}
                  focused={focused}
                  text={statsText}
                />
                <Chart stats={stats} />
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Home;
