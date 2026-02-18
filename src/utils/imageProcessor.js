// utils/imageProcessor.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processImage = async (inputPath, filename) => {
  try {
    const outputPath = path.join(__dirname, '../uploads/optimized', filename);
    
    // Ensure directory exists
    await fs.mkdir(path.join(__dirname, '../uploads/optimized'), { recursive: true });
    
    // Process image
    await sharp(inputPath)
      .resize(800, 800, { // Resize to max 800x800
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toFile(outputPath);
    
    // Delete original file
    await fs.unlink(inputPath);
    
    return `/uploads/optimized/${filename}`;
  } catch (error) {
    console.error('Error processing image:', error);
    return inputPath; // Return original path if processing fails
  }
};