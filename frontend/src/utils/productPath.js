export const getProductPath = (item) => {
  const reference =
    item?.slug ||
    item?.product?.slug ||
    item?.product?._id ||
    item?.product ||
    item?._id;

  if (!reference || typeof reference === 'object') return null;
  return `/products/${encodeURIComponent(String(reference))}`;
};
