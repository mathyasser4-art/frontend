import React, { useRef, useEffect, useState } from 'react';
import './MathQuillEditor.css';

/**
 * MathQuillRenderer - Renders LaTeX math expressions beautifully.
 * Detects if content contains LaTeX and renders it using KaTeX (lightweight).
 * Falls back to plain text for non-LaTeX content.
 */

// Simple LaTeX detector: checks for common LaTeX patterns
const isLaTeX = (text) => {
    if (!text) return false;
    const s = String(text);
    return /\\(frac|sqrt|sum|int|prod|lim|infty|alpha|beta|gamma|delta|theta|pi|times|div|pm|leq|geq|neq|approx|cdot|left|right|begin|end|overline|underline|hat|bar|vec|text|mathrm|mathbf|mathit|binom|dbinom)/.test(s) ||
           /[\^_{}]/.test(s) && /\\/.test(s);
};

// Lightweight KaTeX-like renderer using CSS
const renderLatexToHTML = (latex) => {
    if (!latex) return '';
    let html = String(latex);

    // Replace \frac{a}{b} with styled fraction
    html = html.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, num, den) => {
        return `<span class="mq-fraction"><span class="mq-numerator">${renderLatexToHTML(num)}</span><span class="mq-fraction-bar"></span><span class="mq-denominator">${renderLatexToHTML(den)}</span></span>`;
    });

    // Replace \sqrt{x} with styled root
    html = html.replace(/\\sqrt\{([^{}]*)\}/g, (_, content) => {
        return `<span class="mq-sqrt"><span class="mq-sqrt-symbol">√</span><span class="mq-sqrt-content">${renderLatexToHTML(content)}</span></span>`;
    });

    // Replace x^{n} with superscript
    html = html.replace(/\^{([^{}]*)}/g, (_, exp) => {
        return `<sup class="mq-sup">${renderLatexToHTML(exp)}</sup>`;
    });
    // Replace x^n (single character)
    html = html.replace(/\^([0-9a-zA-Z])/g, (_, exp) => {
        return `<sup class="mq-sup">${exp}</sup>`;
    });

    // Replace x_{n} with subscript
    html = html.replace(/_{([^{}]*)}/g, (_, sub) => {
        return `<sub class="mq-sub">${renderLatexToHTML(sub)}</sub>`;
    });

    // Replace common symbols
    html = html.replace(/\\times/g, '×');
    html = html.replace(/\\div/g, '÷');
    html = html.replace(/\\pm/g, '±');
    html = html.replace(/\\leq/g, '≤');
    html = html.replace(/\\geq/g, '≥');
    html = html.replace(/\\neq/g, '≠');
    html = html.replace(/\\approx/g, '≈');
    html = html.replace(/\\cdot/g, '·');
    html = html.replace(/\\infty/g, '∞');
    html = html.replace(/\\pi/g, 'π');
    html = html.replace(/\\alpha/g, 'α');
    html = html.replace(/\\beta/g, 'β');
    html = html.replace(/\\gamma/g, 'γ');
    html = html.replace(/\\delta/g, 'δ');
    html = html.replace(/\\theta/g, 'θ');
    html = html.replace(/\\sum/g, '∑');
    html = html.replace(/\\int/g, '∫');
    html = html.replace(/\\prod/g, '∏');
    html = html.replace(/\\leftarrow/g, '←');
    html = html.replace(/\\rightarrow/g, '→');
    html = html.replace(/\\Rightarrow/g, '⇒');
    html = html.replace(/\\Leftarrow/g, '⇐');
    html = html.replace(/\\overline\{([^{}]*)\}/g, '<span style="text-decoration:overline">$1</span>');
    html = html.replace(/\\text\{([^{}]*)\}/g, '<span class="mq-text">$1</span>');
    html = html.replace(/\\mathrm\{([^{}]*)\}/g, '<span class="mq-text">$1</span>');

    // Clean up remaining braces
    html = html.replace(/[{}]/g, '');
    // Clean up remaining backslashes before known words
    html = html.replace(/\\(left|right|,|;|!|\s)/g, '');

    return html;
};

export const MathQuillRenderer = ({ latex, className = '', style = {} }) => {
    if (!latex) return null;

    let text = String(latex);

    // Auto-convert plain text fractions (e.g., 1/2) to LaTeX \frac{1}{2} for better display
    text = text.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

    if (!isLaTeX(text)) {
        // Plain text — just render as-is
        return <span className={`mq-renderer-plain ${className}`} style={style}>{text}</span>;
    }

    // Render LaTeX as HTML
    const html = renderLatexToHTML(text);

    return (
        <span
            className={`mq-renderer ${className}`}
            style={style}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

/**
 * MathQuillEditor - Rich math expression editor with toolbar.
 * Outputs LaTeX string for storage.
 */
export const MathQuillEditor = ({ value = '', onChange, placeholder = 'Type math expression...', rows = 3 }) => {
    const textareaRef = useRef(null);
    const [preview, setPreview] = useState(value);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setPreview(value);
    }, [value]);

    const insertAtCursor = (before, after = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        
        if (onChange) onChange(newText);
        setPreview(newText);

        // Set cursor position after inserted text
        setTimeout(() => {
            const cursorPos = start + before.length + selectedText.length;
            textarea.focus();
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    const toolbarButtons = [
        { label: 'a/b', title: 'Fraction', action: () => insertAtCursor('\\frac{', '}{b}') },
        { label: '√', title: 'Square Root', action: () => insertAtCursor('\\sqrt{', '}') },
        { label: 'x²', title: 'Exponent', action: () => insertAtCursor('^{', '}') },
        { label: 'x₂', title: 'Subscript', action: () => insertAtCursor('_{', '}') },
        { label: '×', title: 'Multiply', action: () => insertAtCursor('\\times ') },
        { label: '÷', title: 'Divide', action: () => insertAtCursor('\\div ') },
        { label: '±', title: 'Plus/Minus', action: () => insertAtCursor('\\pm ') },
        { label: '≤', title: 'Less/Equal', action: () => insertAtCursor('\\leq ') },
        { label: '≥', title: 'Greater/Equal', action: () => insertAtCursor('\\geq ') },
        { label: '≠', title: 'Not Equal', action: () => insertAtCursor('\\neq ') },
        { label: '≈', title: 'Approx', action: () => insertAtCursor('\\approx ') },
        { label: 'π', title: 'Pi', action: () => insertAtCursor('\\pi ') },
        { label: '∞', title: 'Infinity', action: () => insertAtCursor('\\infty ') },
        { label: '∑', title: 'Summation', action: () => insertAtCursor('\\sum ') },
        { label: '→', title: 'Arrow', action: () => insertAtCursor('\\rightarrow ') },
        { label: 'ā', title: 'Overline', action: () => insertAtCursor('\\overline{', '}') },
    ];

    const handleTextChange = (e) => {
        const newVal = e.target.value;
        if (onChange) onChange(newVal);
        setPreview(newVal);
    };

    return (
        <div className="mq-editor-container">
            {/* Toolbar */}
            <div className="mq-toolbar">
                {toolbarButtons.map((btn, i) => (
                    <button
                        key={i}
                        type="button"
                        className="mq-toolbar-btn"
                        title={btn.title}
                        onClick={(e) => { e.preventDefault(); btn.action(); }}
                    >
                        {btn.label}
                    </button>
                ))}
                <button
                    type="button"
                    className={`mq-toolbar-btn mq-preview-toggle ${showPreview ? 'active' : ''}`}
                    title="Toggle Preview"
                    onClick={(e) => { e.preventDefault(); setShowPreview(!showPreview); }}
                >
                    👁️
                </button>
            </div>

            {/* Text Input */}
            <textarea
                ref={textareaRef}
                className="mq-textarea"
                value={value}
                onChange={handleTextChange}
                placeholder={placeholder}
                rows={rows}
            />

            {/* Live Preview */}
            {showPreview && preview && (
                <div className="mq-live-preview">
                    <span className="mq-preview-label">Preview:</span>
                    <div className="mq-preview-content">
                        <MathQuillRenderer latex={preview} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MathQuillEditor;
