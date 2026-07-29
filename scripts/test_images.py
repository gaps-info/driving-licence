import fitz
import os

pdf_path = '汽車筆試題庫_公告115.06.9.pdf'
doc = fitz.open(pdf_path)

out_dir = 'public/signs'
os.makedirs(out_dir, exist_ok=True)

total_imgs = 0
for pno in range(len(doc)):
    page = doc[pno]
    image_list = page.get_images(full=True)
    if image_list:
        print(f"Page {pno+1} has {len(image_list)} images")
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            img_filename = f"page_{pno+1}_img_{img_index+1}.{image_ext}"
            with open(os.path.join(out_dir, img_filename), "wb") as f:
                f.write(image_bytes)
            total_imgs += 1

print(f"Total extracted images: {total_imgs}")
