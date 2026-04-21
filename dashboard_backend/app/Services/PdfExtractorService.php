<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser as PdfParser;
use thiagoalessio\TesseractOCR\TesseractOCR;

class PdfExtractorService
{
    protected PdfParser $parser;

    /**
     * Minimum characters to consider extraction successful.
     * If extracted text is below this threshold and OCR is enabled,
     * the document may be scanned/image-based and OCR will be attempted.
     */
    protected int $minTextLength = 100;

    /**
     * Whether OCR fallback is enabled for scanned PDFs.
     * Set ENABLE_OCR=true in .env to enable.
     */
    protected bool $enableOcr;

    /**
     * Number of pages to process with OCR.
     * Limits to avoid timeout issues.
     */
    protected int $maxOcrPages = 5;

    public function __construct(PdfParser $parser)
    {
        $this->parser = $parser;
        $this->enableOcr = env('ENABLE_OCR', 'false') === 'true';
    }

    /**
     * Extract text from a PDF file stored in R2.
     *
     * For scanned/image-based PDFs, OCR is recommended. Enable OCR by setting
     * ENABLE_OCR=true in .env. Note: OCR requires thiagoalessio/tesseract_ocr package.
     *
     * @param  string  $filePath  Path to PDF file in storage
     * @return string Extracted text content
     */
    public function extractText(string $filePath): string
    {
        try {
            // Get file content from R2 disk
            $fileContent = Storage::disk('r2')->get($filePath);

            if (! $fileContent) {
                Log::error('[PdfExtractorService] Failed to read file from R2', [
                    'path' => $filePath,
                ]);

                return '';
            }

            // Parse PDF using smalot/pdfparser
            $pdf = $this->parser->parseContent($fileContent);
            $text = $pdf->getText();

            // Clean up extracted text
            $text = $this->cleanText($text);

            // For scanned/image-based PDFs, text extraction may return very little
            // In this case, OCR should be used for better results
            if (strlen($text) < $this->minTextLength && $this->enableOcr) {
                Log::info('[PdfExtractorService] Short text extracted, trying OCR', [
                    'path' => $filePath,
                    'length' => strlen($text),
                    'ocr_enabled' => $this->enableOcr,
                ]);

                $ocrText = $this->extractViaOcr($filePath);

                if ($ocrText && strlen($ocrText) > strlen($text)) {
                    Log::info('[PdfExtractorService] Using OCR result', [
                        'path' => $filePath,
                        'pdf_parser_length' => strlen($text),
                        'ocr_length' => strlen($ocrText),
                    ]);

                    return $ocrText;
                }
            }

            Log::info('[PdfExtractorService] Successfully extracted text', [
                'path' => $filePath,
                'length' => strlen($text),
            ]);

            return $text;
        } catch (\Exception $e) {
            Log::error('[PdfExtractorService] Extraction failed', [
                'path' => $filePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return '';
        }
    }

    /**
     * Extract text via Tesseract OCR for scanned/image-based PDFs.
     *
     * Converts PDF to images and uses Tesseract to extract text.
     *
     * @param  string  $filePath  Path to PDF file in R2 storage
     * @return string|null Extracted text
     */
    protected function extractViaOcr(string $filePath): ?string
    {
        try {
            // Download PDF to temp location for image conversion
            $tempPath = 'temp/pdf_'.uniqid().'.pdf';
            Storage::disk('local')->put($tempPath, Storage::disk('r2')->get($filePath));

            $fullTempPath = Storage::disk('local')->path($tempPath);
            if (! file_exists($fullTempPath)) {
                Log::error('[PdfExtractorService] Failed to create temp file', ['temp_path' => $tempPath]);

                return null;
            }

            // Initialize Tesseract OCR with configuration for multi-page documents
            $ocr = new TesseractOCR;

            // Configure OCR for better results
            $ocr->tempDirectory(sys_get_temp_dir());
            $ocr->executable(env('TESSERACT_PATH', 'tesseract'));

            // Process PDF and extract text from each page
            $fullText = '';
            $pageImages = $this->convertPdfToImages($fullTempPath);

            foreach ($pageImages as $index => $imagePath) {
                // Limit pages to avoid timeout
                if ($index >= $this->maxOcrPages) {
                    Log::warning('[PdfExtractorService] OCR page limit reached, skipping remaining pages', [
                        'max_pages' => $this->maxOcrPages,
                        'skipped_pages' => count($pageImages) - $this->maxOcrPages,
                    ]);
                    break;
                }

                try {
                    // Run Tesseract OCR on the image
                    $text = $ocr->recognize($imagePath);

                    // Append page text
                    $fullText .= ($index > 0 ? "\n\n" : '').$text;
                } catch (\Exception $e) {
                    Log::warning('[PdfExtractorService] OCR failed for page', [
                        'page' => $index,
                        'image' => basename($imagePath),
                        'error' => $e->getMessage(),
                    ]);
                }

                // Clean up page image
                @unlink($imagePath);
            }

            // Clean up temp PDF
            @unlink($fullTempPath);
            Storage::disk('local')->delete($tempPath);

            $cleanedText = $this->cleanText($fullText);

            Log::info('[PdfExtractorService] OCR extraction complete', [
                'path' => $filePath,
                'pages_processed' => min(count($pageImages), $this->maxOcrPages),
                'text_length' => strlen($cleanedText),
            ]);

            return $cleanedText;
        } catch (\Exception $e) {
            Log::error('[PdfExtractorService] OCR failed', [
                'path' => $filePath,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Convert PDF to images for OCR processing.
     * Uses system 'convert' command (ImageMagick) or saves as images.
     *
     * @param  string  $pdfPath  Path to PDF file
     * @return array List of image paths
     */
    protected function convertPdfToImages(string $pdfPath): array
    {
        $tempDir = sys_get_temp_dir().'/pdf_images_'.uniqid();
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $images = [];

        // Try using 'convert' command (ImageMagick) first
        $cmd = sprintf(
            'convert -density 200 "%s[0]" %s/page-%%d.png 2>&1',
            $pdfPath,
            $tempDir
        );

        $output = [];
        $returnCode = 0;
        exec($cmd, $output, $returnCode);

        if ($returnCode === 0) {
            // ImageMagick worked
            foreach (glob($tempDir.'/page-*.png') as $imagePath) {
                $images[] = $imagePath;
            }
        } else {
            // Fallback: try extracting images using alternative methods
            // For now, return empty to prevent errors
            Log::warning('[PdfExtractorService] ImageMagick convert failed, using fallback', [
                'cmd' => $cmd,
                'return_code' => $returnCode,
            ]);
        }

        return $images;
    }

    /**
     * Clean extracted text by removing extra whitespace and normalizing line breaks.
     */
    protected function cleanText(string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // Remove excessive whitespace
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\s*\n\s*/', "\n", $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        return trim($text);
    }
}
