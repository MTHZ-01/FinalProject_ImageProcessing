import traceback
import numpy as np
from PIL import Image
from io import BytesIO
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

# --- IMPORT YOUR FUNCTIONS HERE ---
from .filters.gradient import sobel, prewitt, roberts
from .filters.laplacian import laplacian, laplacian_sharpen
from .filters.highboost import highboost_filter
from .filters.median import median_filter
from .filters.order_statistics import maximum_filter, minimum_filter, midpoint_filter
from .filters.sharpening import sharpen
from .filters.average import average_images, weighted_average_filter, linear_average_filter

# ... rest of your code ...
# Import your custom image processing package here
# e.g., from my_image_pkg import sobel, prewitt, median_filter, etc.

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def process_single_image(file_obj, algorithm_func, **kwargs):
    """Reads a Django file upload, applies the numpy algorithm, and returns an image buffer."""
    # 1. Open image and convert to RGB (standardizes shape)
    img = Image.open(file_obj).convert('L')
    
    # 2. Convert to numpy array
    img_array = np.array(img)
    
    # 3. Apply your custom algorithm
    result_array = algorithm_func(img_array, **kwargs)
    
    # 4. Ensure output is uint8 (your code mostly does this, but good to be safe)
    if result_array.dtype != np.uint8:
        result_array = np.clip(result_array, 0, 255).astype(np.uint8)
        
    # 5. Convert back to an image and save to a byte buffer
    # Note: If your algorithm outputs a 2D array (grayscale), Pillow handles it automatically if we specify mode 'L'
    mode = 'L' if len(result_array.shape) == 2 else 'RGB'
    result_img = Image.fromarray(result_array, mode=mode)
    
    buffer = BytesIO()
    result_img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return buffer

# ==========================================
# VIEWS
# ==========================================

# Map URL parameters to your actual functions
ALGORITHM_MAP = {
    'sobel': sobel,
    'prewitt': prewitt,
    'roberts': roberts,
    'laplacian': laplacian,
    'laplacian_sharpen': laplacian_sharpen,
    'highboost': highboost_filter,
    'median': median_filter,
    'maximum': maximum_filter,
    'minimum': minimum_filter,
    'midpoint': midpoint_filter,
    'average_images': average_images,
    'linear_average': linear_average_filter,
    'weighted_average': weighted_average_filter,
    'sharpen': sharpen,
}

@csrf_exempt
def apply_filter_view(request, filter_name):
    """
    Handles all single-image algorithms.
    Expects a POST request with an image file under the key 'image'.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST requests are allowed."}, status=405)

    if 'image' not in request.FILES:
        return JsonResponse({"error": "No image provided. Use the 'image' key."}, status=400)

    if filter_name not in ALGORITHM_MAP:
        return JsonResponse({"error": f"Filter '{filter_name}' not found."}, status=404)

    try:
        image_file = request.FILES['image']
        algorithm = ALGORITHM_MAP[filter_name]
        
        # You could also extract query params here for things like kernel 'size' or 'A' for highboost
        kwargs = {}

        if filter_name == "highboost" and "A" in request.GET:
            kwargs["A"] = float(request.GET["A"])

        # Process
        output_buffer = process_single_image(image_file, algorithm, **kwargs)
        
        return HttpResponse(output_buffer.getvalue(), content_type="image/png")
        
    except Exception as e:
        traceback.print_exc()
        return JsonResponse(
            {"error": f"Processing failed: {str(e)}"},
            status=500
    )


@csrf_exempt
def average_images_view(request):
    """
    Handles the ensemble/temporal averaging of multiple images.
    Expects a POST request with multiple files under the key 'images'.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST requests are allowed."}, status=405)

    # Use getlist to retrieve multiple files sent under the same key
    uploaded_files = request.FILES.getlist('images')
    
    if len(uploaded_files) < 2:
        return JsonResponse({"error": "Please provide at least two images to average."}, status=400)

    try:
        numpy_images = []
        for file_obj in uploaded_files:
            img = Image.open(file_obj).convert('RGB')
            numpy_images.append(np.array(img))
            
        # Ensure all images are the same shape before passing to your function
        base_shape = numpy_images[0].shape
        if any(img.shape != base_shape for img in numpy_images):
             return JsonResponse({"error": "All images must have the same dimensions."}, status=400)

        # Apply your average_images function
        result_array = average_images(numpy_images)
        
        # Convert back
        mode = 'L' if len(result_array.shape) == 2 else 'RGB'
        result_img = Image.fromarray(result_array, mode=mode)
        
        buffer = BytesIO()
        result_img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return HttpResponse(buffer.getvalue(), content_type="image/png")
        
    except ValueError as ve:
        return JsonResponse({"error": str(ve)}, status=400)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse(
            {"error": f"Processing failed: {str(e)}"},
            status=500)