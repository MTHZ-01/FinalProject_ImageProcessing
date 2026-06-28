import numpy as np


def average_images(images):
    if len(images) == 0:
        raise ValueError("No images supplied.")

    total = np.zeros_like(images[0], dtype=np.float64)

    for img in images:
        total += img.astype(np.float64)

    return (total / len(images)).astype(np.uint8)


def weighted_average_filter(image_array, weights=None, **kwargs):
    if weights is None:
        weights = np.array([
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ]) / 9.0

    padded = np.pad(
        image_array,
        ((1, 1), (1, 1)),
        mode='reflect'
    )

    result = np.zeros_like(image_array, dtype=np.float64)

    for i in range(image_array.shape[0]):
        for j in range(image_array.shape[1]):
            region = padded[i:i + 3, j:j + 3]
            result[i, j] = np.sum(region * weights)

    return result.astype(np.uint8)


def linear_average_filter(image_array, size=3, **kwargs):
    kernel = np.ones((size, size)) / (size * size)

    padded = np.pad(
        image_array,
        ((size // 2, size // 2), (size // 2, size // 2)),
        mode='reflect'
    )

    result = np.zeros_like(image_array, dtype=np.float64)

    for i in range(image_array.shape[0]):
        for j in range(image_array.shape[1]):
            region = padded[i:i + size, j:j + size]
            result[i, j] = np.sum(region * kernel)

    return result.astype(np.uint8)