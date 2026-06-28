import numpy as np

from .utils import convolve
from .smoothing import weighted_average_filter


def sharpen(image):

    """
    Standard sharpening mask

         0 -1  0
        -1  5 -1
         0 -1  0
    """

    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ], dtype=np.float64)

    return convolve(image, kernel)


def laplacian(image):

    """
    Laplacian operator

         0 -1  0
        -1  4 -1
         0 -1  0
    """

    kernel = np.array([
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0]
    ], dtype=np.float64)

    return convolve(image, kernel)


def laplacian_sharpen(image):

    lap = laplacian(image).astype(np.float64)

    result = image.astype(np.float64) - lap

    result = np.clip(result, 0, 255)

    return result.astype(np.uint8)


def highboost_filter(image, A=1.5):

    """
    Highboost filtering

    result = image + A * (image - blurred)
    """

    blur = weighted_average_filter(image).astype(np.float64)

    original = image.astype(np.float64)

    mask = original - blur

    result = original + A * mask

    result = np.clip(result, 0, 255)

    return result.astype(np.uint8)