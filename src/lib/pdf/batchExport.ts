/**
 * 複数HTMLセクションを順番にhtml2canvasでキャプチャしてjsPDFに追加するエンジン。
 */

export interface BatchSection {
  label: string;
  html: string;
  orientation?: 'portrait' | 'landscape';
}

export type ProgressCallback = (done: number, total: number, label: string) => void;

export async function batchExportPdf(
  sections: BatchSection[],
  filename: string,
  onProgress?: ProgressCallback,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const margin: [number, number, number, number] = [12, 10, 12, 10]; // top, right, bottom, left

  let doc: InstanceType<typeof jsPDF> | null = null;
  let firstPage = true;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const orientation = section.orientation ?? 'portrait';

    if (onProgress) {
      onProgress(i, sections.length, section.label);
    }

    const pageW = orientation === 'landscape' ? 297 : 210;
    const pageH = orientation === 'landscape' ? 210 : 297;
    const contentW = pageW - margin[1] - margin[3];
    const contentH = pageH - margin[0] - margin[2];
    const containerWidthPx = orientation === 'landscape' ? 1122 : 794;
    const scale = 2;

    // Create temporary container
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -99999px;
      left: 0;
      width: ${containerWidthPx}px;
      background: white;
      font-family: Inter, 'Helvetica Neue', Arial, 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #000000;
      padding: 0;
      box-sizing: border-box;
    `;
    container.innerHTML = section.html;
    document.body.appendChild(container);

    try {
      await document.fonts.ready;

      const canvas = await html2canvas(container, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: containerWidthPx,
        windowWidth: containerWidthPx,
      });

      // Initialize doc with first section's orientation
      if (doc === null) {
        doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: 'a4',
          compress: true,
        });
      }

      const pageHeightPx = Math.round((contentH / contentW) * canvas.width);
      const totalHeightPx = canvas.height;
      let offsetY = 0;

      try {
        while (offsetY < totalHeightPx) {
          if (firstPage) {
            firstPage = false;
          } else {
            doc.addPage([pageW, pageH], orientation);
          }

          const sliceH = Math.min(pageHeightPx, totalHeightPx - offsetY);

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = pageHeightPx;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0, offsetY, canvas.width, sliceH,
            0, 0, canvas.width, sliceH,
          );

          const sliceData = sliceCanvas.toDataURL('image/png');
          const imgH = contentH * (sliceH / pageHeightPx);
          doc.addImage(sliceData, 'PNG', margin[3], margin[0], contentW, imgH);

          // Release slice canvas memory
          sliceCanvas.width = 0;
          sliceCanvas.height = 0;

          offsetY += pageHeightPx;
        }
      } finally {
        // Release main canvas memory
        canvas.width = 0;
        canvas.height = 0;
      }

      // Yield to allow UI updates (progress bar render)
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    } finally {
      document.body.removeChild(container);
    }
  }

  if (onProgress) {
    onProgress(sections.length, sections.length, '完了');
  }

  if (doc) {
    doc.save(filename);
  }
}
