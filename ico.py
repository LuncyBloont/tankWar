from PIL import Image
import sys

if len(sys.argv) < 2:
    print('A file path should be given by cmd.')
    exit(-1)

path = str(sys.argv[1])

img = Image.open(path)
fname = path[0: path.rindex('.')]
img.save(fname + '.ico')
print('{0} has been saved.', fname + '.ico')