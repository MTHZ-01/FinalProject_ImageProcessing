import numpy as np


# ----------------------------
# NORMALIZATION
# ----------------------------
def normalize(image):
    """
    Normalize image to 0–255 uint8 safely.
    """
    image = image.astype(np.float64)

    min_val = np.min(image)
    max_val = np.max(image)

    if max_val - min_val == 0:
        return np.zeros_like(image, dtype=np.uint8)

    norm = (image - min_val) / (max_val - min_val) * 255.0
    return norm.astype(np.uint8)


# ----------------------------
# GRAYSCALE CONVERSION
# ----------------------------
def to_grayscale(image):
    """
    Convert RGB → grayscale (or pass through if already grayscale)
    """
    if image.ndim == 2:
        return image

    return np.dot(image[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)


# ----------------------------
# PADDING
# ----------------------------
def pad_image(image, pad):
    """
    Edge padding (safe for grayscale only)
    """
    image = to_grayscale(image)

    return np.pad(
        image,
        ((pad, pad), (pad, pad)),
        mode="edge"
    )


# ----------------------------
# CONVOLUTION
# ----------------------------
def convolve(image, kernel):
    """
    2D convolution (grayscale safe)
    """
    image = to_grayscale(image)

    kh, kw = kernel.shape
    pad_h = kh // 2
    pad_w = kw // 2

    padded = np.pad(
        image,
        ((pad_h, pad_h), (pad_w, pad_w)),
        mode="edge"
    )

    output = np.zeros_like(image, dtype=np.float64)

    for y in range(image.shape[0]):
        for x in range(image.shape[1]):
            region = padded[y:y + kh, x:x + kw]
            output[y, x] = np.sum(region * kernel)

    return np.clip(output, 0, 255).astype(np.uint8)