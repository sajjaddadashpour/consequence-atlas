# Masked marker pass (Amendment 8b). Every digit -> '#' before output. Reports, per table page 366-404:
# masked century header lines, and every line containing a non-digit, non-punctuation mark that could be a row marker
# (letters other than column labels, * † ( ) [ ] « » etc.). Also searches prose of the whole volume for how fills are marked.
import re,html,collections
t=open('mie9.txt',encoding='utf-8',errors='replace').read()
t=html.unescape(re.sub(r'<[^>]+>','',t)); L=t.split('\n')
pg=re.compile(r'^\s*[_\-—–]+\s*(\d{3})\s*[_\-—–]*\s*$')
marks=[(i,int(m.group(1))) for i,l in enumerate(L) if (m:=pg.match(l))]
M=lambda s: re.sub(r'\d','#',s)
labels={'ANNÉES.','MINIMA.','MAXIMA.','NIVEAU.','PICS.','COUDÉES.','DOIGTS.','MÈTRES.','CENT.'}
plain=re.compile(r'^[#\s\.,:;\'\-—–o]*$')
print("PROSE SEARCH (whole volume, masked):")
for i,l in enumerate(L):
    if re.search(r'ast[ée]risque|compl[ée]t[ée]e?s? (à|a) l.aide|entre parenth|signe|marqu[ée]e?s? d', l, re.I):
        print(f"  line {i}: {M(l.strip())}")
print("\nTABLE PAGES:")
for k,(i,p) in enumerate(marks):
    if not 366<=p<=404: continue
    j=marks[k+1][0] if k+1<len(marks) else len(L)
    body=[M(x.strip()) for x in L[i+1:j] if x.strip()]
    hdr=[x for x in body if re.search(r'SI[ÈE]CLE|H[ée]gire|chr[ée]tienne',x)]
    sym=collections.Counter(x for x in body if x not in labels and not plain.match(x) and not re.search(r'SI[ÈE]CLE|H[ée]gire|chr[ée]tienne',x))
    print(f"p{p}: lines={len(body)} hdr={hdr} other={dict(sym)}")
