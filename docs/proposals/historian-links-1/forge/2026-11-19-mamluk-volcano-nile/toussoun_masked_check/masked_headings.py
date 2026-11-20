import re,html,sys
t=open('mie9.txt',encoding='utf-8',errors='replace').read()
t=html.unescape(re.sub(r'<[^>]+>','',t))
lines=t.split('\n')
pg=re.compile(r'^\s*[_\-—–]+\s*(\d{3})\s*[_\-—–]*\s*$')
marks=[(i,int(m.group(1))) for i,l in enumerate(lines) if (m:=pg.match(l))]
print("page markers found:",len(marks),"range",marks[0][1] if marks else None,marks[-1][1] if marks else None)
sel=[(i,p) for i,p in marks if 360<=p<=406]
print("markers 360-406:",[p for i,p in sel])
mask=lambda s: re.sub(r'\d','#',s)
# print first 25 nonblank lines after markers for 364-368 and 404-406, masked; and for all table pages only lines with >=4 letters
for i,p in sel:
    if p in (364,365,366,367,404,405,406):
        print(f"\n=== page {p} (first 30 lines, digits masked) ===")
        n=0
        for l in lines[i+1:]:
            if pg.match(l): break
            if l.strip():
                print(mask(l)); n+=1
            if n>=30: break
