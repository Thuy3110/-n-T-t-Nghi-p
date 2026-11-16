import zipfile, re, sys, json, pathlib

doc_path = r'C:\Users\HP\.gemini\antigravity\brain\5e100b2d-e54c-46a9-916f-3014ab254b61\.user_uploaded\media_1794836537970_17489039.docx'

with zipfile.ZipFile(doc_path) as z:
    with z.open('word/document.xml') as f:
        xml = f.read().decode('utf-8')
# Remove XML tags
text = re.sub(r'<[^>]+>', ' ', xml)
# Replace multiple spaces and newlines
text = re.sub(r'\s+', ' ', text).strip()
print(text)
