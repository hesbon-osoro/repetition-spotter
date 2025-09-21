// pages/index.tsx
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import DetectionControls from '../components/editor/DetectionControls';
import Editor from '../components/editor/Editor';
import Toolbar from '../components/editor/Toolbar';
import StatsCards from '../components/analytics/StatsCards';
import RepetitionList from '../components/analytics/RepetitionList';
import Chart from '../components/analytics/Chart';
import { useTextAnalysis } from '../hooks/useTextAnalysis';
import { getColorForMatch } from '../utils/highlightUtils';
import { Repetition } from '../types';

const Home: NextPage = () => {
  const {
    content,
    setContent,
    repetitions,
    stats,
    detectionLevel,
    setDetectionLevel,
    options,
    updateOption,
    analyze,
    clearHighlights,
    clearText,
    quillRef,
  } = useTextAnalysis();

  const handleRepetitionHighlight = (repetition: Repetition) => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();
    if (!editor || !repetition.text) return;

    // Clear existing highlights first
    const length = editor.getLength();
    editor.formatText(0, length, 'background', false);

    // Find and highlight all occurrences of this repetition
    const fullText = editor.getText();
    const searchText = repetition.text;
    const color = getColorForMatch(repetitions.indexOf(repetition));

    let index = 0;
    let occurrenceCount = 0;

    while ((index = fullText.indexOf(searchText, index)) !== -1) {
      editor.formatText(index, searchText.length, 'background', color);

      // Scroll to the first occurrence
      if (occurrenceCount === 0) {
        editor.setSelection(index, searchText.length);
        const bounds = editor.getBounds(index, searchText.length);
        if (bounds) {
          const editorContainer = editor.container;
          if (editorContainer) {
            editorContainer.scrollTo({
              top: bounds.top + editorContainer.scrollTop - 100,
              behavior: 'smooth',
            });
          }
        }
      }

      index += searchText.length;
      occurrenceCount++;
    }
  };

  return (
    <>
      <Head>
        <title>RepetitionSpotter - Professional Text Analysis Tool</title>
        <meta
          name="description"
          content="Advanced text analysis tool to identify repeated content in your writing with VSCode-style highlighting. Perfect for writers, editors, and content creators."
        />
        <meta
          name="keywords"
          content="text analysis, repetition detection, writing tool, content optimization, SEO tool, duplicate content, writing assistant, text similarity, content analysis, writing improvement"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="RepetitionSpotter Team" />
        <meta
          property="og:title"
          content="RepetitionSpotter - Professional Text Analysis Tool"
        />
        <meta
          property="og:description"
          content="Detect and analyze text repetitions with our advanced VSCode-style text analysis tool."
        />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Editor Area */}
            <div className="lg:col-span-3">
              <DetectionControls
                detectionLevel={detectionLevel}
                setDetectionLevel={setDetectionLevel}
                options={options}
                updateOption={updateOption}
              />

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                <Toolbar
                  onAnalyze={analyze}
                  onClearHighlights={clearHighlights}
                  onClearText={clearText}
                  options={options}
                  updateOption={updateOption}
                />
                <Editor
                  content={content}
                  onChange={setContent}
                  quillRef={quillRef}
                />
              </div>

              <StatsCards stats={stats} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <RepetitionList
                repetitions={repetitions}
                onHighlight={handleRepetitionHighlight}
              />
              <Chart stats={stats} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Home;
