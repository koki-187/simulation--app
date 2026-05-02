/**
 * html2canvas + jsPDF でDOM要素をPDFに変換する。
 * html2canvasがブラウザレンダリングエンジンを使うため日本語テキストが正しく表示される。
 */
export async function elementToPdf(options: {
  html: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  margin?: [number, number, number, number]; // [top, right, bottom, left]
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  const { html, filename, orientation = 'portrait', margin = [10, 10, 10, 10] } = options;

  const pageW = orientation === 'landscape' ? 297 : 210;
  const pageH = orientation === 'landscape' ? 210 : 297;
  const contentW = pageW - margin[1] - margin[3];
  const contentH = pageH - margin[0] - margin[2];

  // コンテナ幅をmmからpxに変換 (96dpi基準)
  const scale = 2; // Retina品質
  const containerWidthPx = orientation === 'landscape' ? 1122 : 794;

  // 一時コンテナをbodyに追加（非表示）
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -99999px;
    left: 0;
    width: ${containerWidthPx}px;
    background: white;
    font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #111827;
    padding: 0;
    box-sizing: border-box;
  `;
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // フォントのロードを待つ
    await document.fonts.ready;

    // コンテナ全体をcanvasにレンダリング
    const canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: containerWidthPx,
      windowWidth: containerWidthPx,
    });

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // 1ページ分のcanvas高さ (px, scale込み)
    const pageHeightPx = Math.round((contentH / contentW) * (canvas.width));
    const totalHeightPx = canvas.height;

    let offsetY = 0;
    let pageNum = 0;

    while (offsetY < totalHeightPx) {
      if (pageNum > 0) doc.addPage();

      const sliceH = Math.min(pageHeightPx, totalHeightPx - offsetY);

      // このページ分だけcanvasをスライス
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = pageHeightPx; // 常にフルページ高さ（末尾は白）
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0, offsetY, canvas.width, sliceH,
        0, 0, canvas.width, sliceH
      );

      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      // sliceHが1ページ未満の場合、縦幅を比例縮小
      const imgH = contentH * (sliceH / pageHeightPx);
      doc.addImage(sliceData, 'JPEG', margin[3], margin[0], contentW, imgH);

      offsetY += pageHeightPx;
      pageNum++;
    }

    doc.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
