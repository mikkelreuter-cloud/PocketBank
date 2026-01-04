// Simple icon generator using canvas (requires canvas package)
// Run with: npm install canvas && node generate-icons.js

const fs = require('fs');

// Check if canvas is available
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.log('Canvas package not available. Please install with: npm install canvas');
  console.log('Alternatively, open generate-icons.html in a browser to download icons manually.');
  process.exit(1);
}

const { createCanvas } = Canvas;

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F5F3EF';
  ctx.fillRect(0, 0, size, size);

  // Circle
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.23;

  ctx.strokeStyle = '#8B9A7E';
  ctx.lineWidth = size * 0.023;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Clock hands
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Hour hand (pointing up)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX, centerY - radius * 0.6);
  ctx.stroke();

  // Minute hand (pointing right)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + radius * 0.7, centerY);
  ctx.stroke();

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon-${size}.png`, buffer);
  console.log(`Generated icon-${size}.png`);
}

generateIcon(192);
generateIcon(512);

console.log('Icons generated successfully!');
