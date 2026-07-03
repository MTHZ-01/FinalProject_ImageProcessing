import json
import traceback
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from scipy import ndimage

from channels.generic.websocket import AsyncWebsocketConsumer


# ====================== SPATIAL DOMAIN ENHANCEMENT - GONZALEZ ======================

def negative(image, **kwargs):
    """Image Negative"""
    return 255 - image


def log_transform(image, c=1.0, **kwargs):
    """Log Transformation"""
    img_float = image.astype(np.float64)
    return (c * np.log(1 + img_float)).clip(0, 255).astype(np.uint8)


def power_law(image, gamma=1.0, c=1.0, **kwargs):
    """Power-Law (Gamma) Transformation"""
    img_float = image.astype(np.float64)
    return (c * (img_float ** gamma)).clip(0, 255).astype(np.uint8)


def histogram_equalization(image, **kwargs):
    """Histogram Equalization (very important in Gonzalez)"""
    hist, bins = np.histogram(image.flatten(), 256, [0, 256])
    cdf = hist.cumsum()
    cdf_normalized = (cdf - cdf.min()) * 255 / (cdf.max() - cdf.min())
    equalized = np.interp(image.flatten(), bins[:-1], cdf_normalized).astype(np.uint8)
    return equalized.reshape(image.shape)


def average_filter(image, size=3, **kwargs):
    """Smoothing - Arithmetic Mean Filter"""
    # Clean up incoming param strings or float conversion variants safely
    kernel_size = int(size) if size is not None else 3
    return ndimage.uniform_filter(image, size=kernel_size, mode='reflect').astype(np.uint8)


def gaussian_filter(image, sigma=1.0, **kwargs):
    """Gaussian Smoothing"""
    flt_sigma = float(sigma) if sigma is not None else 1.0
    return ndimage.gaussian_filter(image, sigma=flt_sigma, mode='reflect').astype(np.uint8)


def median_filter(image, size=3, **kwargs):
    """Order-Statistic Filter - Median"""
    kernel_size = int(size) if size is not None else 3
    return ndimage.median_filter(image, size=kernel_size, mode='reflect').astype(np.uint8)


def maximum_filter(image, size=3, **kwargs):
    kernel_size = int(size) if size is not None else 3
    return ndimage.maximum_filter(image, size=kernel_size, mode='reflect').astype(np.uint8)


def minimum_filter(image, size=3, **kwargs):
    kernel_size = int(size) if size is not None else 3
    return ndimage.minimum_filter(image, size=kernel_size, mode='reflect').astype(np.uint8)


def midpoint_filter(image, size=3, **kwargs):
    kernel_size = int(size) if size is not None else 3
    max_f = ndimage.maximum_filter(image, size=kernel_size, mode='reflect')
    min_f = ndimage.minimum_filter(image, size=kernel_size, mode='reflect')
    return ((max_f.astype(np.float64) + min_f) / 2).astype(np.uint8)


def sobel(image, **kwargs):
    gx = ndimage.sobel(image, axis=0)
    gy = ndimage.sobel(image, axis=1)
    return np.clip(np.hypot(gx, gy), 0, 255).astype(np.uint8)


def prewitt(image, **kwargs):
    gx = ndimage.prewitt(image, axis=0)
    gy = ndimage.prewitt(image, axis=1)
    return np.clip(np.hypot(gx, gy), 0, 255).astype(np.uint8)


def roberts(image, **kwargs):
    gx_kernel = np.array([[1, 0], [0, -1]], dtype=np.float64)
    gy_kernel = np.array([[0, 1], [-1, 0]], dtype=np.float64)
    gx = ndimage.convolve(image.astype(np.float64), gx_kernel, mode='reflect')
    gy = ndimage.convolve(image.astype(np.float64), gy_kernel, mode='reflect')
    return np.clip(np.hypot(gx, gy), 0, 255).astype(np.uint8)


def laplacian(image, mask="4", **kwargs):
    """Laplacian - Second Derivative"""
    if str(mask) == "8":
        kernel = np.array([[1, 1, 1], [1, -8, 1], [1, 1, 1]])
    else:
        kernel = np.array([[0, -1, 0], [-1, 4, -1], [0, -1, 0]])
    
    lap = ndimage.convolve(image.astype(np.float64), kernel)
    return np.clip(lap + 128, 0, 255).astype(np.uint8)


def highboost_filter(image, A=1.5, **kwargs):
    """Highboost Filtering - Exact Gonzalez Formula"""
    boost = float(A) if A is not None else 1.5
    img_float = image.astype(np.float64)
    blurred = ndimage.gaussian_filter(img_float, sigma=1.0, mode='reflect')
    return np.clip(img_float + (boost - 1) * (img_float - blurred), 0, 255).astype(np.uint8)


ALGORITHM_MAP = {
    'negative': negative,
    'log': log_transform,
    'power_law': power_law,
    'histogram_eq': histogram_equalization,
    'average': average_filter,
    'gaussian': gaussian_filter,
    'median': median_filter,
    'maximum': maximum_filter,
    'minimum': minimum_filter,
    'midpoint': midpoint_filter,
    'sobel': sobel,
    'prewitt': prewitt,
    'roberts': roberts,
    'laplacian': laplacian,
    'highboost': highboost_filter,
}


# ====================== CONSUMER ======================

class ImageProcessingConsumer(AsyncWebsocketConsumer):
    MAX_IMAGE_SIZE = 100 * 1024 * 1024  # 100 MB

    async def connect(self):
        await self.accept()
        print("✅ WebSocket connected - Spatial Domain Enhancement (Gonzalez)")

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected: {close_code}")

    async def receive(self, text_data=None, bytes_data=None):
        try:
            if bytes_data:
                # Fallback to general processing if raw byte frames are piped without metadata
                await self.process_image(bytes_data)
                return

            if text_data:
                data = json.loads(text_data)
                algorithm = data.get('algorithm')
                params = data.get('params', {})
                request_id = data.get('requestId')  # <-- Extracted request tracking identifier

                if 'image' in data:
                    header, encoded = data['image'].split(",", 1)
                    img_data = base64.b64decode(encoded)
                    await self.process_image(img_data, algorithm, params, request_id)
                else:
                    await self.send_error("No image data received", request_id)
        except Exception as e:
            traceback.print_exc()
            await self.send_error(str(e))

    async def process_image(self, img_data: bytes, algorithm=None, params=None, request_id=None):
        try:
            if len(img_data) > self.MAX_IMAGE_SIZE:
                await self.send_error(f"Image too large ({len(img_data)/(1024*1024):.1f} MB).", request_id)
                return

            img = Image.open(BytesIO(img_data)).convert('L')
            img_array = np.array(img)

            if algorithm and algorithm in ALGORITHM_MAP:
                # Safe fallback parsing logic directly inside functional wrappers 
                result_array = ALGORITHM_MAP[algorithm](img_array, **params)

                result_img = Image.fromarray(result_array, mode='L')
                buffer = BytesIO()
                result_img.save(buffer, format="PNG", optimize=True, compress_level=6)

                result_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

                # Return the state tracking identifier back down the pipeline
                await self.send(text_data=json.dumps({
                    'status': 'success',
                    'requestId': request_id,  # <-- Crucial line linking response context back to client
                    'image': f'data:image/png;base64,{result_base64}',
                    'algorithm': algorithm
                }))
            else:
                await self.send_error(f'Unknown algorithm: {algorithm}', request_id)

        except Exception as e:
            traceback.print_exc()
            await self.send_error(f"Processing error: {str(e)}", request_id)

    async def send_error(self, message: str, request_id=None):
        await self.send(text_data=json.dumps({
            'status': 'error',
            'requestId': request_id,  # Include tracker context even on crash alerts
            'message': message
        }))