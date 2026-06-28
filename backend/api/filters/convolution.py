import numpy as np

def convolve(image, kernel):
    kh, kw = kernel.shape

    pad_h = kh // 2
    pad_w = kw // 2

    padded = np.pad(
        image,
        ((pad_h, pad_h), (pad_w, pad_w)),
        mode='edge'
    )

    output = np.zeros_like(image, dtype=np.float64)

    for y in range(image.shape[0]):
        for x in range(image.shape[1]):

            region = padded[y:y+kh, x:x+kw]

            output[y, x] = np.sum(region * kernel)

    return np.clip(output, 0, 255).astype(np.uint8)