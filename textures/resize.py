from PIL import Image

from resizeimage import resizeimage

with open('gun.jpg', 'r+b') as f:
    with Image.open(f) as image:
        cover = resizeimage.resize_cover(image, [1024, 512])
        cover.save('gun_1024.jpg', image.format)
