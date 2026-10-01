import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './QuestionPdfNoter.css';

/**
 * SavedNotesBoxModal
 * Allows teachers to view all saved question notes,
 * export them as a single combined PDF, and share via WhatsApp.
 */
const SavedNotesBoxModal = ({
  savedNotes = [],
  examTitle = 'Exam Notes',
  onClose,
  onDeleteNote,
  onClearAllNotes,
  onOpenNote
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Generate combined PDF from all saved notes with adaptive per-page dimensions
  const generateCombinedPdf = async () => {
    if (savedNotes.length === 0) {
      alert('No saved question notes in the box.');
      return null;
    }

    setIsExporting(true);
    setExportMessage('Generating combined crystal-clear PDF...');

    try {
      const validNotes = savedNotes.filter((n) => !!n.imageData);
      if (validNotes.length === 0) {
        alert('No notes with image content found.');
        return null;
      }

      const tempPdf = new jsPDF();
      const firstNote = validNotes[0];
      const firstProps = tempPdf.getImageProperties(firstNote.imageData);
      const isFirstLandscape = firstProps.width > firstProps.height;

      const pdf = new jsPDF({
        orientation: isFirstLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [firstProps.width, firstProps.height],
        hotfixes: ['px_scaling']
      });

      pdf.addImage(firstNote.imageData, 'PNG', 0, 0, firstProps.width, firstProps.height, undefined, 'SLOW');

      for (let i = 1; i < validNotes.length; i++) {
        const note = validNotes[i];
        const props = pdf.getImageProperties(note.imageData);
        const isLandscape = props.width > props.height;
        pdf.addPage([props.width, props.height], isLandscape ? 'landscape' : 'portrait');
        pdf.addImage(note.imageData, 'PNG', 0, 0, props.width, props.height, undefined, 'SLOW');
        setExportMessage(`Adding Question ${note.questionIndex + 1} (${i + 1}/${validNotes.length})...`);
      }

      const cleanTitle = (examTitle || 'Exam').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
      const filename = `${cleanTitle}_Teacher_Solutions_Notes.pdf`;

      return { pdf, filename };
    } catch (err) {
      console.error('Error compiling notes PDF:', err);
      alert('Failed to generate combined PDF.');
      return null;
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  const handleDownloadCombinedPdf = async () => {
    const result = await generateCombinedPdf();
    if (result && result.pdf) {
      result.pdf.save(result.filename);
    }
  };

  const handleDownloadSingleScreenshot = (note) => {
    if (!note || !note.imageData) return;
    const cleanTitle = (examTitle || 'Question').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = note.imageData;
    link.download = `Question_${note.questionIndex + 1}_${cleanTitle}_Solution.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllScreenshots = () => {
    if (savedNotes.length === 0) return;
    const cleanTitle = (examTitle || 'Exam').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    savedNotes.forEach((note, idx) => {
      if (!note.imageData) return;
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = note.imageData;
        link.download = `Question_${note.questionIndex + 1}_${cleanTitle}_Solution.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  };

  const handleShareWhatsApp = async () => {
    const result = await generateCombinedPdf();
    if (!result || !result.pdf) return;

    try {
      const pdfBlob = result.pdf.output('blob');
      const pdfFile = new File([pdfBlob], result.filename, { type: 'application/pdf' });

      // Check if Web Share API with files is supported (mobile/supported desktop browsers)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `${examTitle} - Solution Notes`,
          text: `Here are the annotated question solution notes for ${examTitle} (${savedNotes.length} questions).`
        });
        return;
      }
    } catch (shareErr) {
      console.log('Web Share not completed or not supported, falling back to direct link:', shareErr);
    }

    // Fallback: Download file and open WhatsApp Web/App with message
    result.pdf.save(result.filename);
    const message = encodeURIComponent(
      `📚 *${examTitle} - Teacher Solution Notes*\n` +
      `Includes detailed handwritten annotations for ${savedNotes.length} question(s).\n` +
      `The PDF has been downloaded to your device to send as an attachment!`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  return (
    <div className="notes-box-modal" onClick={onClose}>
      <div className="notes-box-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notes-box-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📦</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                Question Notes Box
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {savedNotes.length} annotated {savedNotes.length === 1 ? 'question' : 'questions'} saved
              </p>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {savedNotes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <h4 style={{ color: '#ffffff', margin: '0 0 6px' }}>No notes in the box yet</h4>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Click <strong>"PDF Note"</strong> on any question while solving to write explanations and save them here!
            </p>
          </div>
        ) : (
          <div className="notes-box-grid">
            {savedNotes.map((note, index) => (
              <div key={note.id || index} className="notes-box-card">
                {note.imageData && (
                  <img
                    src={note.imageData}
                    alt={`Question ${note.questionIndex + 1}`}
                    className="notes-box-thumb"
                  />
                )}
                <div className="notes-box-info">
                  <div>
                    <strong style={{ fontSize: '13px', color: '#f1f5f9', display: 'block' }}>
                      Question #{note.questionIndex + 1}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleScreenshot(note)}
                      style={{ background: '#0284c7', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                      title="Download Screenshot (PNG)"
                    >
                      📸
                    </button>
                    {onOpenNote && (
                      <button
                        type="button"
                        onClick={() => onOpenNote(note)}
                        style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                        title="Edit note"
                      >
                        ✏️
                      </button>
                    )}
                    {onDeleteNote && (
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                        title="Delete note"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="notes-box-footer">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="pdf-footer-btn pdf-footer-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            {savedNotes.length > 0 && onClearAllNotes && (
              <button
                type="button"
                className="pdf-footer-btn pdf-footer-btn-secondary"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all notes in the box?')) {
                    onClearAllNotes();
                  }
                }}
                style={{ color: '#fca5a5' }}
              >
                Clear Box
              </button>
            )}
          </div>

          {savedNotes.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="pdf-footer-btn pdf-footer-btn-screenshot"
                onClick={handleDownloadAllScreenshots}
                disabled={isExporting}
                title="Download each question solution as high-resolution PNG screenshot"
              >
                📸 Download Screenshots ({savedNotes.length})
              </button>
              <button
                type="button"
                className="pdf-footer-btn whatsapp-share-btn"
                onClick={handleShareWhatsApp}
                disabled={isExporting}
              >
                <i className="fa fa-whatsapp" style={{ fontSize: '16px' }}></i> Share via WhatsApp
              </button>
              <button
                type="button"
                className="pdf-footer-btn pdf-footer-btn-primary"
                onClick={handleDownloadCombinedPdf}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <span className="btn-spinner"></span> {exportMessage || 'Exporting...'}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-file-pdf"></i> Download Combined PDF ({savedNotes.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedNotesBoxModal;
