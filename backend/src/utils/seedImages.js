// Local assets are served by Vite and included in production builds.
export const seedImage = (garmentType) => `/images/demo/${garmentType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;

export function repairSeedImages(existing, incoming) {
  const placeholder = (value) => !value || value === '/image-placeholder.svg';
  if (incoming.image && placeholder(existing.image)) existing.image = incoming.image;
  if (incoming.images?.length && (!existing.images?.length || existing.images.every(placeholder))) {
    existing.images = incoming.images;
  }
  for (const item of existing.orderItems || []) {
    const replacement = incoming.orderItems?.find((entry) => String(entry.product) === String(item.product));
    if (replacement && placeholder(item.image)) item.image = replacement.image;
  }
  for (const section of ['hero', 'aboutUs']) {
    if (incoming[section]?.imageUrl && placeholder(existing[section]?.imageUrl)) {
      existing.set(`${section}.imageUrl`, incoming[section].imageUrl);
    }
  }
}
