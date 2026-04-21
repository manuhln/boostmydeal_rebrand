<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SemanticChunkerService
{
    protected int $maxChunkSize = 1000; // Maximum characters per chunk

    protected int $minChunkSize = 100; // Minimum characters per chunk

    protected int $overlap = 100; // Characters to overlap between chunks

    /**
     * Chunk text using semantic boundaries (paragraphs and sentences).
     *
     * @param  string  $text  Text to chunk
     * @param  array  $options  Options: max_chunk_size, min_chunk_size, overlap
     * @return array Array of chunks with metadata
     */
    public function chunkText(string $text, array $options = []): array
    {
        $this->maxChunkSize = $options['max_chunk_size'] ?? $this->maxChunkSize;
        $this->minChunkSize = $options['min_chunk_size'] ?? $this->minChunkSize;
        $this->overlap = $options['overlap'] ?? $this->overlap;

        $chunks = [];
        $paragraphs = $this->splitIntoParagraphs($text);

        $currentChunk = '';
        $chunkIndex = 0;
        $currentParagraphIndex = 0;

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if (empty($paragraph)) {
                continue;
            }

            // If adding this paragraph would exceed max size and we have enough content
            if (strlen($currentChunk) + strlen($paragraph) > $this->maxChunkSize
                && strlen($currentChunk) >= $this->minChunkSize
            ) {
                if (! empty($currentChunk)) {
                    $chunks[] = [
                        'text' => $this->trimChunk($currentChunk),
                        'index' => $chunkIndex++,
                        'paragraph_start' => $currentParagraphIndex,
                    ];
                }

                // Add overlap from previous chunk
                $currentChunk = $this->extractOverlap($currentChunk.$paragraph);
            }

            $currentChunk .= "\n\n".$paragraph;
            $currentParagraphIndex++;
        }

        // Add remaining content
        if (strlen($currentChunk) >= $this->minChunkSize) {
            $chunks[] = [
                'text' => $this->trimChunk($currentChunk),
                'index' => $chunkIndex,
                'paragraph_start' => $currentParagraphIndex,
            ];
        }

        // Handle case where single paragraph is too large
        if (empty($chunks) && ! empty($text)) {
            $chunks = $this->splitLargeParagraph($text, $chunkIndex);
        }

        Log::info('[SemanticChunkerService] Chunks created', [
            'total' => count($chunks),
            'original_length' => strlen($text),
        ]);

        return $chunks;
    }

    /**
     * Split text into paragraphs.
     */
    protected function splitIntoParagraphs(string $text): array
    {
        // Split by double newlines or markdown-style headers
        $paragraphs = preg_split('/(\n\s*\n|#{1,6}\s)/', $text);

        return array_map('trim', $paragraphs);
    }

    /**
     * Trim chunk while preserving sentence boundaries.
     */
    protected function trimChunk(string $chunk): string
    {
        $chunk = trim($chunk);

        // Don't end in the middle of a sentence
        $endings = ['.', '!', '?', ';', ':', "\n"];
        $lastChar = substr($chunk, -1);

        if (! in_array($lastChar, $endings) && strlen($chunk) > $this->minChunkSize) {
            // Find last sentence ending
            $lastDot = strrpos($chunk, '.');
            $lastExcl = strrpos($chunk, '!');
            $lastQuestion = strrpos($chunk, '?');
            $lastSentenceEnd = max($lastDot, $lastExcl, $lastQuestion);

            if ($lastSentenceEnd !== false && $lastSentenceEnd > strlen($chunk) / 2) {
                $chunk = substr($chunk, 0, $lastSentenceEnd + 1);
            }
        }

        return trim($chunk);
    }

    /**
     * Extract overlap text from a chunk boundary.
     */
    protected function extractOverlap(string $text): string
    {
        if ($this->overlap <= 0) {
            return '';
        }

        $overlapText = '';
        $sentences = preg_split('/(?<=[.!?])\s+/', $text);
        $sentences = array_reverse($sentences);

        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            if (empty($sentence)) {
                continue;
            }

            $potentialOverlap = $sentence.' '.$overlapText;
            if (strlen($potentialOverlap) <= $this->overlap) {
                $overlapText = $potentialOverlap;
            } else {
                break;
            }
        }

        return trim($overlapText);
    }

    /**
     * Split a large paragraph that exceeds max size.
     */
    protected function splitLargeParagraph(string $text, int $startIndex): array
    {
        $chunks = [];
        $index = $startIndex;

        // Split into sentences first
        $sentences = preg_split('/(?<=[.!?])\s+/', $text);

        $currentChunk = '';
        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            if (empty($sentence)) {
                continue;
            }

            if (strlen($currentChunk.' '.$sentence) > $this->maxChunkSize) {
                if (! empty($currentChunk)) {
                    $chunks[] = [
                        'text' => trim($currentChunk),
                        'index' => $index++,
                    ];
                }
                $currentChunk = $sentence;
            } else {
                $currentChunk .= ' '.$sentence;
            }
        }

        if (! empty($currentChunk)) {
            $chunks[] = [
                'text' => trim($currentChunk),
                'index' => $index,
            ];
        }

        return $chunks;
    }
}
