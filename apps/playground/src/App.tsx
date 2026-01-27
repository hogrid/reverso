import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { examples } from './examples';

type Tab = 'editor' | 'preview' | 'schema';

export default function App() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [code, setCode] = useState(examples[0]?.code ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  const handleExampleChange = (index: number) => {
    setSelectedExample(index);
    const example = examples[index];
    if (example) {
      setCode(example.code);
    }
  };

  // Simple scanner simulation for demo purposes
  const scanCode = (sourceCode: string) => {
    const markers: Array<{
      path: string;
      type: string;
      label?: string;
      line: number;
    }> = [];

    const lines = sourceCode.split('\n');
    const dataReversoRegex = /data-reverso="([^"]+)"/;
    const dataTypeRegex = /data-reverso-type="([^"]+)"/;
    const dataLabelRegex = /data-reverso-label="([^"]+)"/;

    lines.forEach((line, index) => {
      const pathMatch = line.match(dataReversoRegex);
      if (pathMatch?.[1]) {
        const typeMatch = line.match(dataTypeRegex);
        const labelMatch = line.match(dataLabelRegex);
        markers.push({
          path: pathMatch[1],
          type: typeMatch?.[1] ?? 'text',
          label: labelMatch?.[1],
          line: index + 1,
        });
      }
    });

    return markers;
  };

  const markers = scanCode(code);

  // Generate schema from markers
  const generateSchema = (scannedMarkers: typeof markers) => {
    const pages: Record<string, { sections: Record<string, string[]> }> = {};

    scannedMarkers.forEach((marker) => {
      const parts = marker.path.split('.');
      if (parts.length >= 3) {
        const page = parts[0];
        const section = parts[1];
        const field = parts[2];
        if (page && section && field) {
          if (!pages[page]) {
            pages[page] = { sections: {} };
          }
          if (!pages[page].sections[section]) {
            pages[page].sections[section] = [];
          }
          if (!pages[page].sections[section].includes(field)) {
            pages[page].sections[section].push(field);
          }
        }
      }
    });

    return pages;
  };

  const schema = generateSchema(markers);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Reverso Logo">
            <title>Reverso Logo</title>
            <rect width="32" height="32" rx="8" fill="#3b82f6" />
            <path
              d="M10 8h8a4 4 0 014 4v0a4 4 0 01-4 4h-8V8z"
              fill="white"
            />
            <path
              d="M10 16h6l6 8h-4l-4-5.33L10 24V16z"
              fill="white"
            />
          </svg>
          <span>Reverso Playground</span>
        </div>
        <nav className="nav">
          <a href="https://github.com/hogrid/reverso" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="/docs" target="_blank" rel="noopener noreferrer">
            Docs
          </a>
        </nav>
      </header>

      <div className="main">
        <aside className="sidebar">
          <h3>Examples</h3>
          <ul className="example-list">
            {examples.map((example, index) => (
              <li key={example.name}>
                <button
                  type="button"
                  className={selectedExample === index ? 'active' : ''}
                  onClick={() => handleExampleChange(index)}
                >
                  <span className="example-icon">{example.icon}</span>
                  <div className="example-info">
                    <span className="example-name">{example.name}</span>
                    <span className="example-desc">{example.description}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <div className="tabs">
            <button
              type="button"
              className={activeTab === 'editor' ? 'active' : ''}
              onClick={() => setActiveTab('editor')}
            >
              Code Editor
            </button>
            <button
              type="button"
              className={activeTab === 'preview' ? 'active' : ''}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              type="button"
              className={activeTab === 'schema' ? 'active' : ''}
              onClick={() => setActiveTab('schema')}
            >
              Generated Schema
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'editor' && (
              <div className="editor-container">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="preview-container">
                <div className="preview-header">
                  <h4>Detected Markers</h4>
                  <span className="badge">{markers.length} found</span>
                </div>
                {markers.length > 0 ? (
                  <table className="markers-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Path</th>
                        <th>Type</th>
                        <th>Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markers.map((marker) => (
                        <tr key={`${marker.path}-${marker.line}`}>
                          <td className="line-number">{marker.line}</td>
                          <td className="marker-path">{marker.path}</td>
                          <td>
                            <span className="type-badge">{marker.type}</span>
                          </td>
                          <td className="marker-label">{marker.label || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <p>No markers detected. Add <code>data-reverso</code> attributes to your JSX.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schema' && (
              <div className="schema-container">
                <div className="preview-header">
                  <h4>Content Schema</h4>
                  <span className="badge">{Object.keys(schema).length} pages</span>
                </div>
                {Object.keys(schema).length > 0 ? (
                  <div className="schema-tree">
                    {Object.entries(schema).map(([pageName, page]) => (
                      <div key={pageName} className="schema-page">
                        <div className="schema-node page">
                          <span className="node-icon">📄</span>
                          <span className="node-name">{pageName}</span>
                        </div>
                        {Object.entries(page.sections).map(([sectionName, fields]) => (
                          <div key={sectionName} className="schema-section">
                            <div className="schema-node section">
                              <span className="node-icon">📁</span>
                              <span className="node-name">{sectionName}</span>
                            </div>
                            {fields.map((field) => {
                              const marker = markers.find(
                                (m) => m.path === `${pageName}.${sectionName}.${field}`
                              );
                              return (
                                <div key={field} className="schema-node field">
                                  <span className="node-icon">📝</span>
                                  <span className="node-name">{field}</span>
                                  {marker && (
                                    <span className="type-badge small">{marker.type}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No schema generated. Add markers to see the content structure.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="footer">
        <p>
          Reverso CMS - The front-to-back headless CMS.
          <a href="https://github.com/hogrid/reverso" target="_blank" rel="noopener noreferrer">
            Star on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
