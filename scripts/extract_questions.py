# -*- coding: utf-8 -*-
import fitz
import json
import re
import os

pdf_path = '汽車筆試題庫_公告115.06.9.pdf'
doc = fitz.open(pdf_path)

out_dir = 'src/data'
img_dir = 'public/signs'
os.makedirs(out_dir, exist_ok=True)
os.makedirs(img_dir, exist_ok=True)

all_questions_raw = []

cur_section = "架構一 正確觀念與態度"
cur_category = "禁止不當行為（酒駕、不使用手機、危險駕駛）"

for pnum in range(len(doc)):
    page = doc[pnum]
    text = page.get_text("text")
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Track section and category cleanly
    for l in lines:
        if "架構一" in l: cur_section = "架構一 正確觀念與態度"
        elif "架構二" in l: cur_section = "架構二 主動停讓文化"
        elif "架構三" in l: cur_section = "架構三 安全駕駛能力"
        
        if "禁止不當行為" in l: cur_category = "禁止不當行為（酒駕、不使用手機、危險駕駛）"
        elif "其他（平交道" in l or "分類 其他" in l: cur_category = "其他（平交道、強制險、環保駕駛、特殊天候、駕駛道德）"
        elif "路口安全" in l: cur_category = "路口安全（有號誌路口、無號誌路口、停讓行人）"
        elif "轉彎（" in l: cur_category = "轉彎（左右轉、迴轉）"
        elif "注意大型車" in l: cur_category = "注意大型車行駛及轉彎（內輪差、視野死角、不並行）"
        elif "行駛中應注意事項" in l: cur_category = "行駛中應注意事項（保持安全車距、注意前車狀況）"
        elif "正確使用燈光" in l: cur_category = "正確使用燈光（頭燈、霧燈、方向燈）"
        elif "貨物裝載" in l: cur_category = "貨物裝載（防止掉落或滲漏）"
        elif "事故預防" in l: cur_category = "事故預防及處理（預防國道二次事故、急救常識）"
        elif "行車檢查" in l: cur_category = "行車檢查（設備、燈光）"

    i = 0
    while i < len(lines):
        line = lines[i]
        
        q_num = None
        ans = None
        start_j = i + 1

        m_same = re.match(r'^(\d{1,4})\s*[\(\（]([123])[\)\）]', line)
        if m_same and 1 <= int(m_same.group(1)) <= 1090:
            q_num = int(m_same.group(1))
            ans = int(m_same.group(2))
            rest_line = line[m_same.end():].strip()
            start_j = i + 1
        elif line.isdigit() and 1 <= int(line) <= 1090:
            if i + 1 < len(lines):
                m_next = re.match(r'^[\(\（]([123])[\)\）]', lines[i+1])
                if m_next:
                    q_num = int(line)
                    ans = int(m_next.group(1))
                    rest_line = lines[i+1][m_next.end():].strip()
                    start_j = i + 2

        if q_num is not None:
            q_text_lines = []
            if rest_line:
                q_text_lines.append(rest_line)

            j = start_j
            while j < len(lines):
                nxt = lines[j]
                
                if re.match(r'^(\d{1,4})\s*[\(\（]([123])[\)\）]', nxt) and 1 <= int(re.match(r'^(\d{1,4})', nxt).group(1)) <= 1090:
                    break
                if nxt.isdigit() and 1 <= int(nxt) <= 1090 and (j+1 < len(lines) and re.match(r'^[\(\（][123][\)\）]', lines[j+1])):
                    break
                
                if "架構" in nxt or "新版汽車筆試題庫" in nxt or "第 " in nxt or "題   目" in nxt or "題號" in nxt or "圖 示" in nxt or "答 案" in nxt or "題 目" in nxt:
                    j += 1
                    continue
                
                q_text_lines.append(nxt)
                j += 1

            full_raw = " ".join(q_text_lines)
            
            # Split prompt and options
            m1 = re.search(r'[\(\（][1１][\)\）]', full_raw)
            m2 = re.search(r'[\(\（][2２][\)\）]', full_raw)
            m3 = re.search(r'[\(\（][3３][\)\）]', full_raw)
            
            if m1 and m2 and m3 and m1.start() < m2.start() < m3.start():
                prompt = full_raw[:m1.start()].strip()
                opt1 = full_raw[m1.end():m2.start()].strip()
                opt2 = full_raw[m2.end():m3.start()].strip()
                opt3 = full_raw[m3.end():].strip()
                options = [opt1, opt2, opt3]
            else:
                prompt = full_raw
                options = ["", "", ""]

            prompt = re.sub(r'^[：:\s]+', '', prompt)
            if not prompt and options[0]:
                prompt = "請根據標誌/圖示選出正確的含義或說明："

            all_questions_raw.append({
                "id": q_num,
                "ans": ans,
                "prompt": prompt,
                "options": options,
                "section": cur_section,
                "category": cur_category,
                "page": pnum + 1,
                "image": None
            })
            i = j - 1
        i += 1

all_questions_raw.sort(key=lambda x: x["id"])

# Match images
for q in all_questions_raw:
    pno = q["page"] - 1
    page = doc[pno]
    
    q_str = str(q["id"])
    rects = page.search_for(q_str)
    
    valid_q_rect = None
    for r in rects:
        if r.x0 < 120:
            valid_q_rect = r
            break
            
    if valid_q_rect:
        image_list = page.get_images(full=True)
        for img_info in image_list:
            xref = img_info[0]
            for img_bbox in page.get_image_rects(xref):
                img_y_center = (img_bbox.y0 + img_bbox.y1) / 2
                if valid_q_rect.y0 - 20 <= img_y_center <= valid_q_rect.y1 + 45:
                    base_img = doc.extract_image(xref)
                    img_filename = f"q_{q['id']}.{base_img['ext']}"
                    img_filepath = os.path.join(img_dir, img_filename)
                    with open(img_filepath, "wb") as img_f:
                        img_f.write(base_img["image"])
                    q["image"] = f"signs/{img_filename}"
                    break

json_out_path = os.path.join(out_dir, "questions.json")
with open(json_out_path, "w", encoding="utf-8") as f:
    json.dump(all_questions_raw, f, ensure_ascii=False, indent=2)

print(f"Extraction complete! Saved {len(all_questions_raw)} questions to {json_out_path}")
