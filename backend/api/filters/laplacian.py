import numpy as np

from .utils import convolve


def laplacian(image):

    kernel = np.array([
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0]
    ], dtype=np.float64)

    result = convolve(image, kernel)

    result = np.abs(result)

    result = np.clip(result, 0, 255)

    return result.astype(np.uint8)


def laplacian_sharpen(image):

    kernel = np.array([
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0]
    ], dtype=np.float64)

    lap = convolve(image, kernel)

    result = image.astype(np.float64) - lap

    result = np.clip(result, 0, 255)

    return result.astype(np.uint8)