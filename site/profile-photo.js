export const PROFILE_PHOTO_KEY = 'profile-photo';
const types = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Rasterize a small centered square rather than storing a full-resolution file.
// No image is sent to a server in this browser-only prototype.
export async function prepareProfilePhoto(file, {
  decode = value => createImageBitmap(value),
  canvas = () => document.createElement('canvas'),
} = {}) {
  if (!file || !types.has(file.type)) throw new Error('Choose a JPG, PNG, WebP or GIF image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
  let image;
  try { image = await decode(file); }
  catch { throw new Error('This image could not be opened. Please choose another image.'); }
  try {
    if (!image.width || !image.height) throw new Error('This image could not be opened. Please choose another image.');
    const output = canvas();
    output.width = output.height = 512;
    const context = output.getContext('2d');
    // White backing keeps transparent files readable when converted to JPEG.
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, 512, 512);
    const side = Math.min(image.width, image.height);
    context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 512, 512);
    return output.toDataURL('image/jpeg', .85);
  } finally { image.close?.(); }
}
