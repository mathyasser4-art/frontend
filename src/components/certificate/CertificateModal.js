import React, { useEffect, useRef } from 'react';
import './CertificateModal.css';

/**
 * CertificateModal Component
 * Renders a premium, landscape A4-oriented certificate preview and enables browser printing.
 * 
 * Props:
 * - isOpen (boolean): visibility of the preview modal
 * - onClose (function): callback to close the modal
 * - studentName (string): name of the recipient (for single mode)
 * - rank (number): student final rank (1 to 10) (for single mode)
 * - score (number): correct answers (for single mode)
 * - totalQuestions (number): total questions in the competition (for single mode)
 * - competitionTitle (string): name of the battle
 * - teacherName (string): host teacher's name
 * - isMasterminds (boolean): whether to display the Masterminds logo
 * - bulkStudents (array): list of up to 10 student objects for bulk printing [{ userName, rank, score }]
 */
function CertificateModal({
    isOpen,
    onClose,
    studentName,
    rank,
    score,
    totalQuestions,
    competitionTitle,
    teacherName,
    isMasterminds = true,
    bulkStudents = null
}) {
    const modalRef = useRef(null);

    // Escape key listener to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Helpers to get styles and copy based on rank
    const getRankData = (r) => {
        const rankNum = parseInt(r, 10);
        if (rankNum === 1) {
            return {
                themeClass: 'theme-gold',
                awardTitle: 'CHAMPIONSHIP GOLD AWARD',
                sealIcon: '🏆',
                badgeText: '1st Place',
                motivation: 'For achieving the ultimate glory of 1st Place! Your unmatched calculation speed and flawless mental concentration have crowned you the Champion of the Arena.'
            };
        } else if (rankNum === 2) {
            return {
                themeClass: 'theme-silver',
                awardTitle: 'EXCELLENCE SILVER AWARD',
                sealIcon: '🥈',
                badgeText: '2nd Place',
                motivation: 'For an outstanding podium finish! Your exceptional mathematical precision and rapid responses have placed you among the calculation elite.'
            };
        } else if (rankNum === 3) {
            return {
                themeClass: 'theme-bronze',
                awardTitle: 'EXCELLENCE BRONZE AWARD',
                sealIcon: '🥉',
                badgeText: '3rd Place',
                motivation: 'For an outstanding podium finish! Your exceptional mathematical precision and rapid responses have placed you among the calculation elite.'
            };
        } else {
            return {
                themeClass: 'theme-elite',
                awardTitle: 'ELITE FINALIST AWARD',
                sealIcon: '✨',
                badgeText: `Top 10 (#${rankNum})`,
                motivation: 'For earning a distinguished position in the Top 10! Your stellar performance, dedication, and mental arithmetic prowess shine brightly.'
            };
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const renderSingleCertificate = (name, sRank, sScore) => {
        const { themeClass, awardTitle, sealIcon, badgeText, motivation } = getRankData(sRank);
        const currentDate = new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return (
            <div className={`certificate-sheet ${themeClass}`}>
                {/* Guilloche Watermark / Elegant background pattern */}
                <div className="certificate-watermark"></div>

                {/* Triple Geometric Frame */}
                <div className="border-outer">
                    <div className="border-middle">
                        <div className="border-inner">
                            {/* Decorative Corners */}
                            <div className="corner corner-tl"></div>
                            <div className="corner corner-tr"></div>
                            <div className="corner corner-bl"></div>
                            <div className="corner corner-br"></div>

                            {/* Certificate Header Logos */}
                            <header className="cert-header">
                                <div className="cert-logo-container left-logo">
                                    <img src="/logo.png" alt="AbacusHeroes Logo" className="logo-abacus" />
                                </div>
                                <div className="cert-title-area">
                                    <span className="academy-main-subtext">ABACUS HEROES CHAMPIONSHIP</span>
                                </div>
                                <div className="cert-logo-container right-logo">
                                    {isMasterminds ? (
                                        <img src="/img/masterminds_logo.png" alt="Masterminds Logo" className="logo-masterminds" />
                                    ) : (
                                        <div className="logo-spacer"></div>
                                    )}
                                </div>
                            </header>

                            {/* Core Award Type */}
                            <section className="cert-body">
                                <div className="award-badge">{badgeText}</div>
                                <h1 className="cert-main-title">{awardTitle}</h1>
                                
                                <p className="presented-to">This is proudly presented to</p>
                                
                                <h2 className="recipient-name" translate="no" className="notranslate">
                                    {name}
                                </h2>
                                
                                <div className="divider-line"></div>
                                
                                <p className="motivating-sentence">
                                    {motivation}
                                </p>

                                <div className="battle-metadata">
                                    In recognition of your exceptional speed, mental focus, and math intelligence in the live arena battle: 
                                    <strong translate="no" className="notranslate"> "{competitionTitle || 'Abacus Arena Battle'}"</strong>
                                    {sScore !== undefined && totalQuestions !== undefined && (
                                        <span> solving <strong>{sScore} out of {totalQuestions}</strong> questions correctly!</span>
                                    )}
                                </div>
                            </section>

                            {/* Bottom Credentials & Seal */}
                            <footer className="cert-footer">
                                <div className="sign-col">
                                    <div className="signature-line">
                                        <span className="digital-sig text-signature">AbacusHeroes</span>
                                    </div>
                                    <span className="sign-title">AbacusHeroes Academy</span>
                                </div>

                                <div className="seal-col">
                                    <div className="diploma-seal">
                                        <span className="seal-icon">{sealIcon}</span>
                                        <div className="seal-text-ring">
                                            OFFICIAL SEAL • EXCELLENCE
                                        </div>
                                    </div>
                                </div>

                                <div className="sign-col">
                                    <div className="signature-line">
                                        <span className="digital-sig text-signature-teacher" translate="no" className="notranslate">
                                            {teacherName || 'Arena Director'}
                                        </span>
                                    </div>
                                    <span className="sign-title">
                                        {isMasterminds ? 'Masterminds Host' : 'Classroom Instructor'}
                                    </span>
                                </div>
                            </footer>

                            {/* Date Watermark or text */}
                            <div className="cert-date-stamp">
                                Issued: {currentDate}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const isBulk = Array.isArray(bulkStudents) && bulkStudents.length > 0;

    return (
        <div className="cert-modal-overlay" ref={modalRef} onClick={onClose}>
            {/* Modal actions bar - hidden when printing */}
            <div className="cert-modal-header-actions" onClick={(e) => e.stopPropagation()}>
                <div className="actions-left">
                    <span className="badge-live">Print Setup Ready</span>
                    <span className="actions-title">
                        {isBulk ? `Top 10 Winners Certificates (${bulkStudents.length})` : `${studentName}'s Certificate`}
                    </span>
                </div>
                <div className="actions-right">
                    <button onClick={handlePrint} className="btn-action-primary">
                        🖨️ {isBulk ? 'Print All Certificates' : 'Print Certificate'}
                    </button>
                    <button onClick={onClose} className="btn-action-secondary">
                        ✕ Close Preview
                    </button>
                </div>
            </div>

            {/* Content area: prints landscape A4 sheets */}
            <div className="cert-modal-body" onClick={(e) => e.stopPropagation()}>
                <div className="printable-certificate-container">
                    {isBulk ? (
                        bulkStudents.map((stud, index) => (
                            <React.Fragment key={stud.student?._id || stud._id || index}>
                                {renderSingleCertificate(
                                    stud.student?.userName || stud.userName,
                                    stud.rank || (index + 1),
                                    stud.score
                                )}
                                {/* Page break for printer parsing */}
                                {index < bulkStudents.length - 1 && <div className="page-break"></div>}
                            </React.Fragment>
                        ))
                    ) : (
                        renderSingleCertificate(studentName, rank, score)
                    )}
                </div>
            </div>
        </div>
    );
}

export default CertificateModal;
