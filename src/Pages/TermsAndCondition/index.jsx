import React, { useContext, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { BootstrapContext } from '../../Context/Bootstrap';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useLocation } from 'react-router-dom';
import Loader from '../../Components/Loader/Loader';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const TermsAndCondition = () => {
    const { state } = useLocation();
    const { url } = state;
    const [numPages, setNumPages] = useState(2);

    return (
        <div
            style={{
                maxWidth: '100%',           // Fit within parent width
                maxHeight: '100vh',         // Set a fixed height
                overflow: 'auto',           // Add scroll if content overflows
                // border: '1px solid #ccc',   // Optional: for visibility
                // padding: '10px',            // Optional: for spacing
            }}
        >
            <Document
                file={url}
                loading={<span style={{ display: 'none' }} />}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadError={(error) => console.error('Error loading PDF:', error)}

            >
                <div style={{
                    borderBottom: '1px solid #000',
                }}>
                    <Page
                        loading=''
                        pageNumber={1}
                        width={window.innerWidth}
                        height={window.innerHeight}
                    />
                </div>
                <div style={{
                    borderBottom: '1px solid #000',
                    marginBottom: 15
                }}>
                    <Page
                        loading=''
                        pageNumber={2}
                        width={window.innerWidth}
                        height={window.innerHeight}
                    />
                </div>
            </Document>
        </div>
    );
};

export default TermsAndCondition;