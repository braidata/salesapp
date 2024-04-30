import os
import tempfile
from pdf2image import convert_from_path
import pytesseract
from io import BytesIO
from PIL import Image

def extract_text_from_pdf(file) -> str:
    """Extracts text from a PDF file using OCR"""
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the file content to the temporary file
            temp_file.write(file.read())
            temp_file_path = temp_file.name

        # Convert PDF pages to images
        images = convert_from_path(temp_file_path)
        text = ""
        for image in images:
            # Perform OCR on each image
            page_text = pytesseract.image_to_string(image, lang='spa')
            text += page_text + "\n"

        # Remove the temporary file
        os.unlink(temp_file_path)

        return text
    except Exception as e:
        print(f"Error al extraer texto del archivo PDF: {str(e)}")
        return ""

def extract_text_from_image(file) -> str:
    """Extracts text from an image file using OCR"""
    try:
        # Open the image file using PIL
        image = Image.open(BytesIO(file.read()))
        # Perform OCR on the image
        text = pytesseract.image_to_string(image, lang='spa')
        return text
    except Exception as e:
        print(f"Error al extraer texto de la imagen: {str(e)}")
        return ""

def extract_text(file) -> str:
    print('Procesando archivo:', file.filename)
    _, file_extension = os.path.splitext(file.filename)
    file_extension = file_extension.lower()

    if file_extension == ".pdf":
        print('Extrayendo texto de archivo PDF')
        return extract_text_from_pdf(file)
    elif file_extension in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
        print('Extrayendo texto de imagen')
        return extract_text_from_image(file)
    else:
        print(f"Unsupported file type: {file_extension}")
        return None