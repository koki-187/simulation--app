/**
 * jsPDFのhtml()メソッドを使ってDOM要素をPDFに変換する。
 * ブラウザのレンダリングエンジンを使うため日本語テキストが正しく表示される。
 */
export async function elementToPdf(options: {
  html: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  margin?: [number, number, number, number]; // [top, right, bottom, left]
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { html, filename, orientation = 'portrait', margin = [10, 10, 10, 10] } = options;

  // 一時コンテナをbodyに追加（非表示）
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: ${orientation === 'landscape' ? '1060px' : '794px'};
    background: white;
    font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #111827;
    padding: 0;
  `;
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageW = orientation === 'landscape' ? 297 : 210;
    const contentW = pageW - margin[1] - margin[3];
    const windowWidth = orientation === 'landscape' ? 1060 : 794;

    await new Promise<void>((resolve, reject) => {
      doc.html(container, {
        callback: (d) => {
          d.save(filename);
          resolve();
        },
        x: margin[3],
        y: margin[0],
        width: contentW,
        windowWidth,
        margin,
        autoPaging: 'text',
      });
    });
  } finally {
    document.body.removeChild(container);
  }
}
