from PIL import Image
import sys
import io

from numpy import byte

if len(sys.argv) < 2:
    print('Too less arguments, at less one need.')
    exit(-1)
    
path = sys.argv[1]
opath = path[0: str(path).rindex('.')] + '.' + 'map'

img = Image.open(path)

data = img.load()

def getP(x, y):
    x = (x % img.width + img.width) % img.width
    y = (y % img.height + img.height) % img.height
    return data[x, y][0]

with open(opath, 'wb') as f:
    for y in range(img.height):
        for x in range(img.width):
            f.write(byte((getP(x, y) + getP(x + 1, y) + getP(x, y + 1) + getP(x + 1, y + 1)) / 4))

