from PIL import Image

from resizeimage import resizeimage

with open('space.jpg', 'r+b') as f:
    with Image.open(f) as image:
        cover = resizeimage.resize_cover(image, [512, 512])
        cover.save('space_512.png', image.format)
