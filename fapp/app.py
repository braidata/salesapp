from flask import Flask, request, jsonify
import ocr

app = Flask(__name__)

@app.route('/api/ocr', methods=['POST'])
def process_ocr():
    # Obtiene el archivo enviado en la solicitud
    file = request.files['file']
    if not file:
        print('No file received')
        return jsonify({'error': 'No file received'})

    print('Archivo recibido en el servidor Flask:', file.filename)

    # Realiza el procesamiento OCR
    text = ocr.extract_text(file)

    if text is not None:
        # Devuelve la respuesta como JSON
        response = {'text': text}
        return jsonify(response)
    else:
        # Devuelve una respuesta de error si no se pudo extraer texto
        return jsonify({'error': 'Failed to extract text from the file'})

if __name__ == '__main__':
    app.run(port=7777)


# from flask import Flask, request, jsonify
# import pandas as pd
# #importa opencv
# import sys





# app = Flask(__name__)

# @app.route('/api', methods=['POST'])
# def process_data():
#     # Obtiene los datos enviados en la solicitud
#     data = request.get_json()
    
#     # Realiza el procesamiento de los datos
#     df = pd.DataFrame(data)
#     df = df.drop_duplicates()
#     df = df.to_json(orient='records')
    
    
    
#     # Devuelve la respuesta como JSON
#     #response = {'result': df.to_dict(orient='records')}
#     print(df)
#     print(sys.version)
#     return df
#     # send_file(df.to_csv(index=False), attachment_filename='data.csv', as_attachment=True)

    
    
    

# if __name__ == '__main__':
#     app.run(port=7777)


# from flask import Flask, request, jsonify, send_file
# import pytesseract
# import os
# from werkzeug.utils import secure_filename

# app = Flask(__name__)

# UPLOAD_FOLDER = 'uploads'
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# @app.route('/api', methods=['POST'])
# def process_data():
#     # Obtiene la imagen enviada en la solicitud
#     file = request.files['file']
#     filename = secure_filename(file.filename)
#     filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#     file.save(filepath)

#     # Realiza el procesamiento de la imagen con pytesseract
#     text = pytesseract.image_to_string(filepath)

#     # Devuelve el texto extraído como respuesta en formato JSON
#     response = {'text': text}
#     return jsonify(response)

# if __name__ == '__main__':
#     app.run(port=7777)