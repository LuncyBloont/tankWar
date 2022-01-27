from PIL import Image
import os
import sys

def resizeImage(path: str):
    pathSplit = path.split('.')
    img = Image.open(path)
    img.save(path + '.back.' + pathSplit[-1])
    img.resize((256, 256)).save(path)

os.chdir(sys.path[0])
imgs = []
files = os.listdir(sys.path[0])
for i in files:
    pathSplit = i.split('.')
    if (pathSplit[-1] == 'png' or pathSplit[-1] == 'bmp' or \
        pathSplit[-1] == 'jpg' or pathSplit[-1] == 'jpeg') and \
            'back' not in pathSplit:
        print('Image file found: {0}'.format(i))
        resizeImage(i)
        print('Image resize compllete')   
