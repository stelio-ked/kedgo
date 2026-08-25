import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_medallion_mask(w, h, cx, cy):
    sw, sh = w * 4, h * 4
    scx, scy = cx * 4, cy * 4
    
    mask = Image.new("L", (sw, sh), 0)
    draw = ImageDraw.Draw(mask)
    
    # 1. Circular base rim: radius = 214.5 px
    r_circle = 214.5 * 4
    draw.ellipse([scx - r_circle, scy - r_circle, scx + r_circle, scy + r_circle], fill=255)
    
    # 2. Main 4 Compass Points (N, S, E, W)
    # North
    draw.polygon([
        (scx - 24 * 4, scy - 195 * 4),
        (scx, scy - 242 * 4),
        (scx + 24 * 4, scy - 195 * 4)
    ], fill=255)
    
    # South
    draw.polygon([
        (scx - 24 * 4, scy + 195 * 4),
        (scx, scy + 242 * 4),
        (scx + 24 * 4, scy + 195 * 4)
    ], fill=255)
    
    # East
    draw.polygon([
        (scx + 195 * 4, scy - 24 * 4),
        (scx + 242 * 4, scy),
        (scx + 195 * 4, scy + 24 * 4)
    ], fill=255)
    
    # West
    draw.polygon([
        (scx - 195 * 4, scy - 24 * 4),
        (scx - 242 * 4, scy),
        (scx - 195 * 4, scy + 24 * 4)
    ], fill=255)

    smooth_mask = mask.resize((w, h), Image.Resampling.LANCZOS)
    return smooth_mask

def create_refined_logo():
    input_path = os.path.join("public", "logo_transparent_raw.png")
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    cx, cy = 256.0, 256.0
    pixels = img.load()

    # Create a smooth clean texture patch for the bronze channel
    # Radius profile of the bronze channel: from r=164 to r=198
    # We can compute the average color profile at each radius r from the clean ring at angle 150°..170°
    r_profile = {}
    for r_int in range(160, 205):
        samples = []
        for a_deg in range(150, 172):
            rad = math.radians(a_deg)
            sx = int(cx + r_int * math.cos(rad))
            sy = int(cy + r_int * math.sin(rad))
            samples.append(pixels[sx, sy])
        avg_r = int(sum(s[0] for s in samples) / len(samples))
        avg_g = int(sum(s[1] for s in samples) / len(samples))
        avg_b = int(sum(s[2] for s in samples) / len(samples))
        r_profile[r_int] = (avg_r, avg_g, avg_b, 255)

    cleaned_img = img.copy()
    cleaned_pixels = cleaned_img.load()
    
    for y in range(h):
        for x in range(w):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            angle_rad = math.atan2(dy, dx)
            angle_deg = math.degrees(angle_rad) % 360.0
            
            # Bronze ring channel where old text was: radius 164..199, angle 38°..142°
            if 164 <= dist <= 199 and 38 <= angle_deg <= 142:
                r_key = int(round(dist))
                if r_key in r_profile:
                    # Subtle natural variation
                    base_c = r_profile[r_key]
                    noise = int((math.sin(x * 0.4) * math.cos(y * 0.4)) * 6)
                    nr = max(0, min(255, base_c[0] + noise))
                    ng = max(0, min(255, base_c[1] + noise))
                    nb = max(0, min(255, base_c[2] + noise))
                    cleaned_pixels[x, y] = (nr, ng, nb, 255)

    # 2. Render "K E D G O" in the lower channel (Radius R = 181.5)
    scale = 4
    canvas_size = (w * scale, h * scale)
    text_canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    
    font_paths = [
        "C:\\Windows\\Fonts\\georgiab.ttf",
        "C:\\Windows\\Fonts\\timesbd.ttf",
        "C:\\Windows\\Fonts\\palab.ttf"
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            font = ImageFont.truetype(fp, size=int(25 * scale))
            break
    if font is None:
        font = ImageFont.load_default()

    letters = ["K", "E", "D", "G", "O"]
    # Angular positions nicely spaced in lower arc
    letter_angles = [118.0, 104.0, 90.0, 76.0, 62.0]
    
    text_r = 181.5 * scale
    text_cx = cx * scale
    text_cy = cy * scale

    for char, deg in zip(letters, letter_angles):
        rad = math.radians(deg)
        lx = text_cx + text_r * math.cos(rad)
        ly = text_cy + text_r * math.sin(rad)
        
        bbox = font.getbbox(char)
        cw = bbox[2] - bbox[0] + 32 * scale
        ch = bbox[3] - bbox[1] + 32 * scale
        
        char_img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        
        ox = 16 * scale - bbox[0]
        oy = 16 * scale - bbox[1]
        
        # 3D Engraved Finish matching "EXPLORE":
        # 1. Dark upper inset shadow
        char_draw.text((ox - 1.4 * scale, oy - 1.4 * scale), char, font=font, fill=(24, 12, 8, 250))
        # 2. Lower bronze highlight bevel
        char_draw.text((ox + 1.4 * scale, oy + 1.4 * scale), char, font=font, fill=(245, 210, 165, 235))
        # 3. Main antique bronze engraved letter face
        char_draw.text((ox, oy), char, font=font, fill=(72, 44, 30, 255))
        
        rot_deg = 90.0 - deg
        rotated_char = char_img.rotate(rot_deg, resample=Image.BICUBIC, expand=True)
        
        rcw, rch = rotated_char.size
        paste_x = int(lx - rcw / 2)
        paste_y = int(ly - rch / 2)
        text_canvas.alpha_composite(rotated_char, (paste_x, paste_y))

    # Downscale text layer
    text_layer = text_canvas.resize((w, h), Image.Resampling.LANCZOS)
    composite = Image.alpha_composite(cleaned_img, text_layer)

    # 3. Apply the supersampled anti-aliased mask
    mask = get_medallion_mask(w, h, cx, cy)
    composite.putalpha(mask)

    # 4. Save master logo
    output_path = os.path.join("public", "logo.png")
    composite.save(output_path, "PNG")
    print(f"Master logo saved: {output_path}")

    # 5. Generate all alias files and favicon sizes!
    aliases = [
        "kedgo-badge.png",
        "kedgo-emblem.png",
        "kedgo-logo.png",
        "kedpelomundo-logo.png",
        "pwa-512.png"
    ]
    for alias in aliases:
        composite.save(os.path.join("public", alias), "PNG")
        print(f"Saved alias: public/{alias}")

    # PWA 192x192
    pwa192 = composite.resize((192, 192), Image.Resampling.LANCZOS)
    pwa192.save(os.path.join("public", "pwa-192.png"), "PNG")
    print("Saved public/pwa-192.png")

    # Apple Touch Icon 180x180
    apple_icon = composite.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join("public", "apple-touch-icon.png"), "PNG")
    print("Saved public/apple-touch-icon.png")

    # Favicon 32x32
    fav32 = composite.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save(os.path.join("public", "favicon-32x32.png"), "PNG")
    print("Saved public/favicon-32x32.png")

    # Favicon 16x16
    fav16 = composite.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save(os.path.join("public", "favicon-16x16.png"), "PNG")
    print("Saved public/favicon-16x16.png")

    # Favicon PNG (64x64)
    fav_png = composite.resize((64, 64), Image.Resampling.LANCZOS)
    fav_png.save(os.path.join("public", "favicon.png"), "PNG")
    print("Saved public/favicon.png")

    # Favicon ICO (multi-size 16, 32, 48, 64)
    composite.save(
        os.path.join("public", "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("Saved public/favicon.ico")

if __name__ == "__main__":
    create_refined_logo()
