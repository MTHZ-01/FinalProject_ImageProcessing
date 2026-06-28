import numpy as np

from .utils import convolve
from .utils import normalize


def average_filter(image, size=3):

    kernel = np.ones((size, size), dtype=np.float64)

    kernel = normalize(kernel)

    return convolve(image, kernel)


def linear_average_filter(image):

    kernel = np.array([
        [1,1,1],
        [1,1,1],
        [1,1,1]
    ], dtype=np.float64)

    kernel = normalize(kernel)

    return convolve(image, kernel)


def weighted_average_filter(image):

    kernel = np.array([
        [1,2,1],
        [2,4,2],
        [1,2,1]
    ], dtype=np.float64)

    kernel = normalize(kernel)

    return convolve(image, kernel)