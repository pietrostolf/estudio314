# Gera as imagens de prévia dos links (og:image) em JPG 1200 x 630, a partir das fotos dos produtos.
# Uso: C:/Python312/python.exe og_imagens.py   (rode de novo quando trocar uma foto principal)
# Foto inteira no meio; as laterais repetem a borda da foto.
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
FOTOS = ["kit-natal-kit7", "carimbo-personalizado", "presepio-kit", "casinha-duas-aguas",
         "gabaritos-alca-kit11", "kit-natal-resultado-mesa"]
W, H = 1200, 630
SAIDA = AQUI / "img" / "og"
SAIDA.mkdir(parents=True, exist_ok=True)

for nome in FOTOS:
    src = next((AQUI / "img" / "produtos" / f"{nome}{ext}" for ext in (".png", ".jpg", ".webp")
                if (AQUI / "img" / "produtos" / f"{nome}{ext}").exists()))
    im = Image.open(src).convert("RGB")
    # Foto inteira em 630 de altura no meio; cada lateral repete a coluna da borda (o fundo do render é liso,
    # então o degradê de luz continua sem emenda).
    foto = im.resize((round(im.width * H / im.height), H), Image.Resampling.LANCZOS)
    if foto.width >= W:  # foto mais larga que 1200:630: corta no centro
        foto = foto.crop(((foto.width - W) // 2, 0, (foto.width - W) // 2 + W, H))
    x = (W - foto.width) // 2
    fundo = Image.new("RGB", (W, H))
    if x > 0:
        fundo.paste(foto.crop((0, 0, 4, H)).resize((x, H)), (0, 0))
        fundo.paste(foto.crop((foto.width - 4, 0, foto.width, H)).resize((W - x - foto.width, H)), (x + foto.width, 0))
    fundo.paste(foto, (x, 0))
    out = SAIDA / f"{nome}.jpg"
    fundo.save(out, "JPEG", quality=85, optimize=True, progressive=True)
    kb = out.stat().st_size / 1024
    assert kb < 300, f"{out.name}: {kb:.0f} KB"
    print(f"{out.name}: {kb:.0f} KB")
