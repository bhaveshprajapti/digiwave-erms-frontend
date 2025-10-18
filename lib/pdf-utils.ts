import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';
import { createRoot } from 'react-dom/client';
import QuotationPDF from '@/components/quotations/quotation-pdf';

export async function downloadQuotationPDF(quotationNo: string, elementId: string = 'quotation-pdf-content') {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error('Quotation PDF element not found');
  }

  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 595,
      height: 842,
      ignoreElements: (element) => {
        // Ignore elements that might cause issues
        return element.classList?.contains('ignore-pdf') || false;
      },
    });

    // A4 dimensions in mm
    const imgWidth = 210; // A4 width in mm
    const imgHeight = 297; // A4 height in mm

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');
    
    // Add image to PDF (fit to A4 page)
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Download the PDF
    pdf.save(`Quotation-${quotationNo}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function generateAndDownloadQuotationPDF(quotationData: any) {
  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);

  try {
    // Render the PDF component into the temporary container
    const root = createRoot(tempContainer);
    
    // Create a promise that resolves when the component is rendered
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement('div', null,
          React.createElement(QuotationPDF, { 
            quotation: quotationData, 
            showDownloadButton: false 
          })
        )
      );
      // Wait for the component to render
      setTimeout(resolve, 1000);
    });

    // Generate PDF from the rendered component
    await downloadQuotationPDF(quotationData.quotation_no || 'quotation');

    // Cleanup
    root.unmount();
    document.body.removeChild(tempContainer);
  } catch (error) {
    // Cleanup on error
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    throw error;
  }
}
