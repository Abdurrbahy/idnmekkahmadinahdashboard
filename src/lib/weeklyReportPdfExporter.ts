import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PdfExportOptions {
  fileName: string
  onProgress?: (current: number, total: number, message: string) => void
}

/**
 * Exports multiple slide DOM elements to a single 16:9 landscape PDF.
 * Each slide element must be a 16:9 container.
 */
export async function exportSlidesToPdf(
  slideElements: HTMLElement[],
  options: PdfExportOptions
): Promise<{ success: boolean; error?: string }> {
  if (!slideElements || slideElements.length === 0) {
    return { success: false, error: 'Tidak ada slide yang ditemukan untuk diekspor.' }
  }

  const { fileName, onProgress } = options
  const totalSlides = slideElements.length

  try {
    // 16:9 aspect ratio standard in inches (13.333 x 7.5 inches)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [13.333, 7.5],
      compress: true,
    })

    onProgress?.(0, totalSlides, 'Mempersiapkan dokumen PDF 16:9...')

    for (let i = 0; i < totalSlides; i++) {
      const slideEl = slideElements[i]
      onProgress?.(i + 1, totalSlides, `Merender Slide ${i + 1} dari ${totalSlides}...`)

      // Wait a tick for fonts/DOM to be ready
      await new Promise((r) => setTimeout(r, 60))

      const canvas = await html2canvas(slideEl, {
        scale: 2, // 2x resolution for crisp text, charts, and photos
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1280,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      if (i > 0) {
        pdf.addPage([13.333, 7.5], 'landscape')
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 13.333, 7.5, undefined, 'FAST')
    }

    onProgress?.(totalSlides, totalSlides, 'Menyimpan file PDF...')
    pdf.save(fileName)

    return { success: true }
  } catch (err: any) {
    console.error('PDF generation error:', err)
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan saat memproses ekspor PDF.',
    }
  }
}

/**
 * Builds clean, standardized filename for the 10-slide coordinator weekly report PDF.
 * Example: Weekly-Report-IDN-Mekkah-Madinah-Pekan-02-Oktober-2026.pdf
 */
export function buildWeeklyReportPdfFilename(
  cabang: string = 'Mekkah & Madinah',
  pekanKe: number = 1,
  bulan: string = 'Oktober',
  tahun: number = 2026
): string {
  const cleanCabang = cabang
    .replace(/[&]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')

  const padPekan = String(pekanKe).padStart(2, '0')
  return `Weekly-Report-IDN-${cleanCabang}-Pekan-${padPekan}-${bulan}-${tahun}.pdf`
}
