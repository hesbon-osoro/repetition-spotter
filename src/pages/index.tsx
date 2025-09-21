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
  } = useTextAnalysis();

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
                <Editor content={content} onChange={setContent} />
              </div>

              <StatsCards stats={stats} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <RepetitionList repetitions={repetitions} />
              <Chart stats={stats} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Home;
