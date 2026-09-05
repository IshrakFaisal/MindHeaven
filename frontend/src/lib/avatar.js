const MAX_SOURCE_SIZE = 4 * 1024 * 1024;
const MAX_DIMENSION = 360;

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('The selected image could not be read.'));
  reader.readAsDataURL(file);
});

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('The selected file is not a valid image.'));
  image.src = source;
});

export async function prepareProfileImage(file) {
  if (!file) return '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a PNG, JPEG, or WebP image.');
  }
  if (file.size > MAX_SOURCE_SIZE) throw new Error('Choose an image smaller than 4 MB.');

  const source = await readFile(file);
  const image = await loadImage(source);
  const edge = Math.min(image.naturalWidth, image.naturalHeight);
  const size = Math.min(MAX_DIMENSION, edge);
  const offsetX = Math.max(0, (image.naturalWidth - edge) / 2);
  const offsetY = Math.max(0, (image.naturalHeight - edge) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, offsetX, offsetY, edge, edge, 0, 0, size, size);

  const result = canvas.toDataURL('image/webp', 0.82);
  if (result.length > 550000) throw new Error('This image is still too large after processing. Try a simpler photo.');
  return result;
}
