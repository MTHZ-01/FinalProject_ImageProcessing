import numpy as np
from .average import weighted_average_filter


def highboost_filter(image, A=1.5):
    original = image.astype(np.float64)

    blurred = weighted_average_filter(image).astype(np.float64)

    mask = original - blurred

    result = original + A * mask

    result = np.clip(result, 0, 255)

    return result.astype(np.uint8)