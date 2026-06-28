import numpy as np

from .utils import to_grayscale
from .utils import pad_image


def _process(image, size, operation):

    image = to_grayscale(image)

    pad = size // 2

    padded = pad_image(image, pad)

    h, w = image.shape

    output = np.zeros_like(image)

    for y in range(h):

        for x in range(w):

            region = padded[
                y:y+size,
                x:x+size
            ].flatten()

            if operation == "median":
                output[y, x] = np.median(region)

            elif operation == "max":
                output[y, x] = np.max(region)

            elif operation == "min":
                output[y, x] = np.min(region)

            elif operation == "midpoint":
                output[y, x] = (
                    np.max(region) +
                    np.min(region)
                ) / 2

    return output.astype(np.uint8)


def median_filter(image, size=3):

    return _process(image, size, "median")


def maximum_filter(image, size=3):

    return _process(image, size, "max")


def minimum_filter(image, size=3):

    return _process(image, size, "min")


def midpoint_filter(image, size=3):

    return _process(image, size, "midpoint")