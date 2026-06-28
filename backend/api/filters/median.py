import numpy as np

from .utils import to_grayscale
from .utils import pad_image


def median_filter(image, size=3):

    image = to_grayscale(image)

    pad = size // 2

    padded = pad_image(image, pad)

    height, width = image.shape

    output = np.zeros_like(image)

    for y in range(height):

        for x in range(width):

            values = []

            for i in range(size):
                for j in range(size):

                    values.append(
                        padded[y+i, x+j]
                    )

            values.sort()

            output[y, x] = values[len(values)//2]

    return output