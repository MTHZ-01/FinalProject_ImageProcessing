# api/consumers.py
import json
import traceback
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from scipy import ndimage

from channels.generic.websocket import AsyncWebsocketConsumer


# ====================== FILTER FUNCTIONS ======================

def convolve(image, kernel):
    return ndimage.convolve(image, kernel, mode='reflect', cval=0.0).clip(0, 255).astype(np.uint8)


def average_filter(image, size=3, **kwargs):
    kernel = np.ones((size, size), dtype=np.float64) / (size * size)
    return convolve(image, kernel)


def weighted_average_filter(image, size=3, **kwargs):
    kernel = np.array([[1,2,1],[2,4,2],[1,2,1]], dtype=np.float64)
    kernel = kernel / kernel.sum()
    return convolve(image, kernel)


def gaussian_filter(image, size=3, sigma=1.0, **kwargs):
    return weighted_average_filter(image, size, **kwargs)


def median_filter(image, size=3, **kwargs):
    pad = size // 2
    padded = np.pad(image, pad, mode='reflect')
    h, w = image.shape
    output = np.zeros_like(image)
    for y in range(h):
        for x in range(w):
            region = padded[y:y+size, x:x+size].flatten()
            output[y, x] = np.median(region)
    return output.astype(np.uint8)


def maximum_filter(image, size=3, **kwargs):
    pad = size // 2
    padded = np.pad(image, pad, mode='reflect')
    h, w = image.shape
    output = np.zeros_like(image)
    for y in range(h):
        for x in range(w):
            output[y, x] = np.max(padded[y:y+size, x:x+size])
    return output.astype(np.uint8)


def minimum_filter(image, size=3, **kwargs):
    pad = size // 2
    padded = np.pad(image, pad, mode='reflect')
    h, w = image.shape
    output = np.zeros_like(image)
    for y in range(h):
        for x in range(w):
            output[y, x] = np.min(padded[y:y+size, x:x+size])
    return output.astype(np.uint8)


def midpoint_filter(image, size=3, **kwargs):
    pad = size // 2
    padded = np.pad(image, pad, mode='reflect')
    h, w = image.shape
    output = np.zeros_like(image)
    for y in range(h):
        for x in range(w):
            region = padded[y:y+size, x:x+size]
            output[y, x] = (np.max(region) + np.min(region)) / 2
    return output.astype(np.uint8)


def sobel(image, **kwargs):
    gx = np.array([[-1,0,1],[-2,0,2],[-1,0,1]], dtype=np.float64)
    gy = np.array([[-1,-2,-1],[0,0,0],[1,2,1]], dtype=np.float64)
    gx = convolve(image, gx).astype(np.float64)
    gy = convolve(image, gy).astype(np.float64)
    return np.clip(np.sqrt(gx**2 + gy**2), 0, 255).astype(np.uint8)


def prewitt(image, **kwargs):
    gx = np.array([[-1,0,1],[-1,0,1],[-1,0,1]], dtype=np.float64)
    gy = np.array([[-1,-1,-1],[0,0,0],[1,1,1]], dtype=np.float64)
    gx = convolve(image, gx).astype(np.float64)
    gy = convolve(image, gy).astype(np.float64)
    return np.clip(np.sqrt(gx**2 + gy**2), 0, 255).astype(np.uint8)


def roberts(image, **kwargs):
    gx = np.array([[1,0],[0,-1]], dtype=np.float64)
    gy = np.array([[0,1],[-1,0]], dtype=np.float64)
    gx = convolve(image, gx).astype(np.float64)
    gy = convolve(image, gy).astype(np.float64)
    return np.clip(np.sqrt(gx**2 + gy**2), 0, 255).astype(np.uint8)


def laplacian(image, mask="4", **kwargs):
    if mask == "8":
        kernel = np.array([[1,1,1],[1,-8,1],[1,1,1]], dtype=np.float64)
    else:
        kernel = np.array([[0,-1,0],[-1,4,-1],[0,-1,0]], dtype=np.float64)
    result = convolve(image, kernel)
    return np.clip(np.abs(result), 0, 255).astype(np.uint8)


def laplacian_sharpen(image, mask="4", **kwargs):
    lap = laplacian(image, mask=mask).astype(np.float64)
    return np.clip(image.astype(np.float64) - lap, 0, 255).astype(np.uint8)


def highboost_filter(image, A=1.5, **kwargs):
    blurred = weighted_average_filter(image)
    mask = image.astype(np.float64) - blurred.astype(np.float64)
    result = image.astype(np.float64) + A * mask
    return np.clip(result, 0, 255).astype(np.uint8)


ALGORITHM_MAP = {
    'average': average_filter,
    'weighted_average': weighted_average_filter,
    'gaussian': gaussian_filter,
    'median': median_filter,
    'maximum': maximum_filter,
    'minimum': minimum_filter,
    'midpoint': midpoint_filter,
    'sobel': sobel,
    'prewitt': prewitt,
    'roberts': roberts,
    'laplacian': laplacian,
    'laplacian_sharpen': laplacian_sharpen,
    'highboost': highboost_filter,
}


# ====================== WEBSOCKET CONSUMER ======================

class ImageProcessingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("WebSocket connected")

    async def disconnect(self, close_code):
        print("WebSocket disconnected")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            algorithm = data['algorithm']
            params = data.get('params', {})
            image_base64 = data['image']

            # Decode base64 to image
            header, encoded = image_base64.split(",", 1)
            img_data = base64.b64decode(encoded)
            img = Image.open(BytesIO(img_data)).convert('L')
            img_array = np.array(img)

            # Process
            if algorithm in ALGORITHM_MAP:
                result_array = ALGORITHM_MAP[algorithm](img_array, **params)

                # Convert back to base64
                result_img = Image.fromarray(result_array, mode='L')
                buffer = BytesIO()
                result_img.save(buffer, format="PNG")
                result_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

                await self.send(text_data=json.dumps({
                    'status': 'success',
                    'image': f'data:image/png;base64,{result_base64}',
                    'algorithm': algorithm
                }))
            else:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': 'Algorithm not found'
                }))

        except Exception as e:
            traceback.print_exc()
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': str(e)
            }))