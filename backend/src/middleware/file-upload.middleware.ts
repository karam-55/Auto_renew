import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export const saveBase64Image = (base64Data: string, filename: string): string => {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'vehicle-attachments');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Extract the base64 data (remove data:image/xxx;base64, prefix)
  const base64Image = base64Data.split(';base64,').pop();
  if (!base64Image) {
    throw new Error('Invalid base64 data');
  }

  // Create file path
  const filePath = path.join(uploadsDir, filename);

  // Save the file
  fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

  // Return the public URL
  return `/uploads/vehicle-attachments/${filename}`;
};

export const deleteFile = (fileUrl: string): void => {
  const filePath = path.join(process.cwd(), fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
