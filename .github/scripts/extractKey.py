
from PIL import Image
import requests
import base64
import io
import sys

class Megacloud2:
    def __init__(self):
        self.name = "Megacloud2"
        self.mainUrl = "https://megacloud.tv"
        #self.embed = "embed-1/ajax/e-1"
        self.scriptUrl = f"{self.mainUrl}/js/player/a/prod/e1-player.min.js"
        #self.luckyImageUrl = f"https://rabbitstream.net/images/image.png?v=0.0.7"
        self.luckyImageUrl = f"https://megacloud.tv/images/lucky_animal/icon.png"
        #self.luckyImageUrl = f"https://rabbitstream.net/images/loading.png"



    def extractRealKey(self):
        image_response = requests.get(self.luckyImageUrl)
        image = Image.open(io.BytesIO(image_response.content))
        width, height = image.size
        pixel_data = []

        for y in range(height):
            for x in range(width):
                pixel = image.getpixel((x, y))
                pixel_data.extend([int(channel) for channel in pixel])

        encoded_byte_array = self.computeKeyFromImage(pixel_data)

        #key = base64.b64encode(encoded_byte_array).decode('utf-8')
        print(list(encoded_byte_array))
        #return key;
        return list(encoded_byte_array)

    def computeKeyFromImage(self, image):
        image_chunks = ""
        image_chunks_to_char = ""
        image_chunks_to_char_to_hex = []

        for i in range(image[3] * 8):
            image_chunks += str(image[(i + 1) * 4 + 3] % 2)

        image_chunks = image_chunks[:len(image_chunks) - len(image_chunks) % 2]
        for i in range(0, len(image_chunks), 8):
            image_chunks_to_char += chr(int(image_chunks[i:i + 8], 2))

        for i in range(0, len(image_chunks_to_char) - 1, 2):
            image_chunks_to_char_to_hex.append(int(image_chunks_to_char[i:i + 2], 16))

        key = bytes(image_chunks_to_char_to_hex)
        return key

if len(sys.argv) == 2:
    #input = sys.argv[1]
    output = sys.argv[1]
    with open(output, "w+", encoding="utf-8") as out:
    
        out.write(str(Megacloud2().extractRealKey()))    

    