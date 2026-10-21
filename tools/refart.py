import numpy as np
from PIL import Image
from scipy import ndimage as nd
CACHE={}
def fgmask(path, sat_t=0.16):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int)
    mx=a.max(2); mn=a.min(2); L=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11)
    sat=(mx-mn)/np.maximum(mx,1)
    cand=(sat<sat_t)&(L>58)
    lab,n=nd.label(cand)
    border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    return a, ~np.isin(lab,list(border))
def cut(path, box, sat_t=0.16, keep_all=False):
    """box: x0,y0,x1,y1 in source px. returns RGBA crop of the main figure"""
    a,m=fgmask(path,sat_t)
    x0,y0,x1,y1=box
    a=a[y0:y1,x0:x1]; m=m[y0:y1,x0:x1].copy()
    # flood from crop border too
    mo=nd.binary_opening(m,iterations=2)
    lab,n=nd.label(mo)
    if not keep_all and n>1:
        sizes=nd.sum(mo,lab,range(1,n+1)); big=np.argmax(sizes)+1
        bb=nd.find_objects(lab)[big-1]
        keep=np.zeros_like(mo)
        for i,s in enumerate(nd.find_objects(lab)):
            if sizes[i]<1500: continue
            # keep pieces overlapping main bbox
            if s[0].start<bb[0].stop and s[0].stop>bb[0].start and s[1].start<bb[1].stop and s[1].stop>bb[1].start:
                keep|=lab==i+1
        mo=keep
    mo=nd.binary_fill_holes(mo)
    ys,xs=np.where(mo)
    a=a[ys.min():ys.max()+1, xs.min():xs.max()+1]; mo=mo[ys.min():ys.max()+1, xs.min():xs.max()+1]
    rgba=np.dstack([a,mo*255]).astype(np.uint8)
    return Image.fromarray(rgba,'RGBA')
def tone(px, th=(232,160,62)):
    r,g,b=px[:3]; L=.3*r+.59*g+.11*b; V=max(r,g,b); t=.5*L+.5*V
    return 0 if t>th[0] else 1 if t>th[1] else 2 if t>th[2] else 3
def shrink(img, h, w=None, th=(232,160,62), outline=True, pad=1):
    ih=h-2*pad if outline else h
    iw=w-2*pad if (w and outline) else w
    if iw is None: iw=max(1,round(img.width*ih/img.height))
    # premultiplied box resize
    a=np.asarray(img).astype(float); al=a[...,3:4]/255
    pm=np.dstack([a[...,:3]*al, al[...,0]*255])
    im=Image.fromarray(pm.astype(np.uint8),'RGBA').resize((iw,ih),Image.BOX)
    s=np.asarray(im).astype(float)
    grid=[[None]*iw for _ in range(ih)]
    for y in range(ih):
        for x in range(iw):
            A=s[y,x,3]
            if A<110: continue
            grid[y][x]=tone(s[y,x,:3]*255/A, th)
    if outline:
        W2=iw+2*pad; H2=ih+2*pad
        g2=[[None]*W2 for _ in range(H2)]
        for y in range(ih):
            for x in range(iw): g2[y+pad][x+pad]=grid[y][x]
        out=[r[:] for r in g2]
        for y in range(H2):
            for x in range(W2):
                if g2[y][x] is None and any(0<=y+dy<H2 and 0<=x+dx<W2 and g2[y+dy][x+dx] is not None for dy,dx in((1,0),(-1,0),(0,1),(0,-1))):
                    out[y][x]=3
        grid=out
    return grid
def fit(grid, W, H, align='bottom'):
    gh=len(grid); gw=len(grid[0])
    out=[[None]*W for _ in range(H)]
    ox=(W-gw)//2; oy=H-gh if align=='bottom' else 0
    for y in range(gh):
        for x in range(gw):
            X=x+ox; Y=y+oy
            if 0<=X<W and 0<=Y<H and grid[y][x] is not None: out[Y][X]=grid[y][x]
    return out
def rows(grid): return [''.join('.' if v is None else str(v) for v in r) for r in grid]
def preview(grids, path, scale=4, pal=('#f4f1de','#b7c9a0','#5b7a65','#1e2b26')):
    Wt=sum(len(g[0]) for g in grids)+4*len(grids); Ht=max(len(g) for g in grids)
    im=Image.new('RGB',(Wt,Ht),'#c8d8e8'); x0=0
    P=[tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in pal]
    for g in grids:
        for y,r in enumerate(g):
            for x,v in enumerate(r):
                if v is not None: im.putpixel((x0+x,y),P[v])
        x0+=len(g[0])+4
    im.resize((Wt*scale,Ht*scale),Image.NEAREST).save(path)

def shrink2(img, h, th='auto', outline=True, pad=1, dark=0.34, w=None):
    """tone each source px, then per-cell vote (dark-biased)"""
    a=np.asarray(img).astype(float)
    r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    L=.3*r+.59*g+.11*b; V=np.maximum(np.maximum(r,g),b); t=.5*L+.5*V
    if th=='auto':
        v=t[(al>0)&(t>=45)]
        c=np.percentile(v,[15,50,88])
        for _ in range(30):
            k=np.argmin(np.abs(v[:,None]-c[None]),1)
            c=np.array([v[k==i].mean() if (k==i).any() else c[i] for i in range(3)])
        c.sort()
        th=((c[1]+c[2])/2,(c[0]+c[1])/2,45)
    T=np.where(t>th[0],0,np.where(t>th[1],1,np.where(t>th[2],2,3)))
    T=np.where(al>0,T,-1)
    ih=h-2*pad if outline else h
    iw=w if w else max(1,round(img.width*ih/img.height))
    if w and outline: iw=w-2*pad
    H0,W0=T.shape
    grid=[[None]*iw for _ in range(ih)]
    for y in range(ih):
        for x in range(iw):
            c=T[int(y*H0/ih):max(int(y*H0/ih)+1,int((y+1)*H0/ih)), int(x*W0/iw):max(int(x*W0/iw)+1,int((x+1)*W0/iw))].ravel()
            n=c.size; op=c[c>=0]
            if op.size<n*0.45: continue
            cnt=np.bincount(op,minlength=4)
            if cnt[3]>=op.size*dark: grid[y][x]=3
            else: grid[y][x]=int(np.argmax(cnt))
    if outline:
        W2=iw+2*pad; H2=ih+2*pad
        g2=[[None]*W2 for _ in range(H2)]
        for y in range(ih):
            for x in range(iw): g2[y+pad][x+pad]=grid[y][x]
        out=[rr[:] for rr in g2]
        for y in range(H2):
            for x in range(W2):
                if g2[y][x] is None and any(0<=y+dy<H2 and 0<=x+dx<W2 and g2[y+dy][x+dx] is not None for dy,dx in((1,0),(-1,0),(0,1),(0,-1))):
                    out[y][x]=3
        grid=out
    return grid
