import numpy as np

from .utils import convolve


def sobel(image):

    gx_kernel = np.array([
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ], dtype=np.float64)

    gy_kernel = np.array([
        [-1, -2, -1],
        [ 0,  0,  0],
        [ 1,  2,  1]
    ], dtype=np.float64)

    gx = convolve(image, gx_kernel).astype(np.float64)
    gy = convolve(image, gy_kernel).astype(np.float64)

    gradient = np.sqrt(gx**2 + gy**2)

    gradient = np.clip(gradient, 0, 255)

    return gradient.astype(np.uint8)


def prewitt(image):

    gx_kernel = np.array([
        [-1,0,1],
        [-1,0,1],
        [-1,0,1]
    ], dtype=np.float64)

    gy_kernel = np.array([
        [-1,-1,-1],
        [0,0,0],
        [1,1,1]
    ], dtype=np.float64)

    gx = convolve(image, gx_kernel).astype(np.float64)
    gy = convolve(image, gy_kernel).astype(np.float64)

    gradient = np.sqrt(gx**2 + gy**2)

    gradient = np.clip(gradient,0,255)

    return gradient.astype(np.uint8)


def roberts(image):

    gx_kernel = np.array([
        [1,0],
        [0,-1]
    ], dtype=np.float64)

    gy_kernel = np.array([
        [0,1],
        [-1,0]
    ], dtype=np.float64)

    gx = convolve(image, gx_kernel).astype(np.float64)
    gy = convolve(image, gy_kernel).astype(np.float64)

    gradient = np.sqrt(gx**2 + gy**2)

    gradient = np.clip(gradient,0,255)

    return gradient.astype(np.uint8)