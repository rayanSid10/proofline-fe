import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

async function waitForImages(root, timeoutMs = 8000) {
  const images = Array.from(root.querySelectorAll('img')).filter((img) => img.src);
  if (!images.length) return;

  await Promise.all(
    images.map((img) => new Promise((resolve) => {
      if (img.complete && img.naturalWidth > 0) {
        resolve();
        return;
      }

      const done = () => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
        resolve();
      };

      img.addEventListener('load', done);
      img.addEventListener('error', done);
      setTimeout(done, timeoutMs);
    }))
  );
}

export function buildReportFileName(referenceNumber) {
  const ref = (referenceNumber || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  return `IBMB_Report_${ref}_${date}.pdf`;
}

export async function downloadElementAsPdf(element, fileName) {
  await waitForImages(element);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const canvas = await toCanvas(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    canvasWidth: element.scrollWidth,
    canvasHeight: element.scrollHeight,
  });

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - margin * 2;
  const usablePageHeight = pageHeight - margin * 2;

  const imgData = canvas.toDataURL('image/png');
  const imgHeight = (canvas.height * usableWidth) / canvas.width;

  let remainingHeight = imgHeight;
  let yOffset = margin;

  pdf.addImage(imgData, 'PNG', margin, yOffset, usableWidth, imgHeight, undefined, 'FAST');
  remainingHeight -= usablePageHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    yOffset = margin - (imgHeight - remainingHeight);
    pdf.addImage(imgData, 'PNG', margin, yOffset, usableWidth, imgHeight, undefined, 'FAST');
    remainingHeight -= usablePageHeight;
  }

  pdf.save(fileName);
}
