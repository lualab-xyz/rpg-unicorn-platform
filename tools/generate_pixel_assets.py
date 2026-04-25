import os
import struct
import zlib


def write_png(path, width, height, rgba):
    def chunk(tag, data):
        return (
            struct.pack("!I", len(data))
            + tag
            + data
            + struct.pack("!I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba[y * stride : (y + 1) * stride])

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png += chunk(b"IHDR", struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)


def rgba_canvas(width, height, color=(0, 0, 0, 0)):
    data = bytearray(width * height * 4)
    for y in range(height):
        for x in range(width):
            i = (y * width + x) * 4
            data[i : i + 4] = bytes(color)
    return data


def put_px(data, width, x, y, color):
    if x < 0 or y < 0:
        return
    i = (y * width + x) * 4
    if i < 0 or i + 3 >= len(data):
        return
    data[i : i + 4] = bytes(color)


def put_rect(data, width, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put_px(data, width, xx, yy, color)


def draw_unicorn_frame(data, width, ox, oy, body, mane, horn, outline, step=False, flip=False):
    leg_a = 1 if step else 0
    leg_b = 0 if step else 1

    put_rect(data, width, ox + 2, oy + 4, 10, 8, outline)
    put_rect(data, width, ox + 10, oy + 5, 5, 5, outline)
    put_rect(data, width, ox + 3, oy + 11 + leg_a, 2, 5 - leg_a, outline)
    put_rect(data, width, ox + 7, oy + 11 + leg_b, 2, 5 - leg_b, outline)

    put_rect(data, width, ox + 3, oy + 5, 8, 7, body)
    put_rect(data, width, ox + 10, oy + 6, 4, 4, body)
    put_rect(data, width, ox + 3, oy + 12, 1, 3, body)
    put_rect(data, width, ox + 7, oy + 12, 1, 3, body)

    if not flip:
        put_rect(data, width, ox + 2, oy + 6, 2, 5, mane)
        put_rect(data, width, ox + 10, oy + 4, 3, 2, mane)
        put_rect(data, width, ox + 13, oy + 4, 1, 3, horn)
    else:
        put_rect(data, width, ox + 9, oy + 6, 2, 5, mane)
        put_rect(data, width, ox + 10, oy + 4, 3, 2, mane)
        put_rect(data, width, ox + 10, oy + 4, 1, 3, horn)


def build_tileset(path):
    tile = 16
    cols = 8
    rows = 2
    w = cols * tile
    h = rows * tile
    data = rgba_canvas(w, h)

    colors = {
        "grass_a": (121, 210, 107, 255),
        "grass_b": (105, 188, 93, 255),
        "flower": (252, 232, 255, 255),
        "path_a": (227, 192, 136, 255),
        "path_b": (210, 171, 115, 255),
        "water_a": (79, 149, 232, 255),
        "water_b": (45, 111, 194, 255),
        "foam": (143, 208, 255, 255),
        "bridge_a": (173, 125, 77, 255),
        "bridge_b": (124, 83, 48, 255),
        "bridge_edge": (89, 55, 33, 255),
        "trunk": (90, 59, 36, 255),
        "leaf_a": (176, 141, 255, 255),
        "leaf_b": (143, 109, 226, 255),
    }

    def tile_origin(i):
        return (i % cols) * tile, (i // cols) * tile

    # grass A
    ox, oy = tile_origin(0)
    put_rect(data, w, ox, oy, tile, tile, colors["grass_a"])

    # grass B
    ox, oy = tile_origin(1)
    put_rect(data, w, ox, oy, tile, tile, colors["grass_b"])

    # flower patch
    ox, oy = tile_origin(2)
    put_rect(data, w, ox, oy, tile, tile, colors["grass_a"])
    put_rect(data, w, ox + 6, oy + 6, 3, 3, colors["flower"])

    # path A
    ox, oy = tile_origin(3)
    put_rect(data, w, ox, oy, tile, tile, colors["path_a"])

    # path B
    ox, oy = tile_origin(4)
    put_rect(data, w, ox, oy, tile, tile, colors["path_b"])

    # water A
    ox, oy = tile_origin(5)
    put_rect(data, w, ox, oy, tile, tile, colors["water_a"])
    put_rect(data, w, ox + 2, oy + 2, 11, 2, colors["foam"])

    # water B
    ox, oy = tile_origin(6)
    put_rect(data, w, ox, oy, tile, tile, colors["water_b"])
    put_rect(data, w, ox + 1, oy + 10, 12, 2, colors["foam"])

    # bridge plank
    ox, oy = tile_origin(7)
    put_rect(data, w, ox, oy, tile, tile, colors["bridge_a"])
    put_rect(data, w, ox + 1, oy + 2, 14, 12, colors["bridge_b"])
    put_rect(data, w, ox, oy, tile, 2, colors["bridge_edge"])
    put_rect(data, w, ox, oy + 14, tile, 2, colors["bridge_edge"])

    # trunk
    ox, oy = tile_origin(8)
    put_rect(data, w, ox, oy, tile, tile, (0, 0, 0, 0))
    put_rect(data, w, ox + 5, oy + 6, 6, 10, colors["trunk"])

    # leaf A
    ox, oy = tile_origin(9)
    put_rect(data, w, ox, oy, tile, tile, colors["leaf_b"])
    put_rect(data, w, ox + 2, oy + 2, 12, 10, colors["leaf_a"])

    # leaf B
    ox, oy = tile_origin(10)
    put_rect(data, w, ox, oy, tile, tile, colors["leaf_b"])
    put_rect(data, w, ox + 1, oy + 1, 14, 12, colors["leaf_a"])

    write_png(path, w, h, data)


def build_character(path, body, mane, flip=False):
    w, h = 32, 16
    data = rgba_canvas(w, h)
    outline = (42, 42, 56, 255)
    horn = (255, 226, 112, 255)
    draw_unicorn_frame(data, w, 0, 0, body, mane, horn, outline, step=False, flip=flip)
    draw_unicorn_frame(data, w, 16, 0, body, mane, horn, outline, step=True, flip=flip)
    write_png(path, w, h, data)


def build_panel(path):
    w, h = 24, 24
    data = rgba_canvas(w, h, (16, 19, 32, 255))
    outer = (0, 0, 0, 255)
    inner = (246, 247, 255, 255)

    put_rect(data, w, 0, 0, w, h, outer)
    put_rect(data, w, 2, 2, w - 4, h - 4, inner)
    put_rect(data, w, 4, 4, w - 8, h - 8, (16, 19, 32, 255))
    write_png(path, w, h, data)


def build_button(path):
    w, h = 24, 24
    data = rgba_canvas(w, h, (15, 31, 50, 255))
    outer = (0, 0, 0, 255)
    inner = (246, 247, 255, 255)
    accent = (255, 154, 209, 255)

    put_rect(data, w, 0, 0, w, h, outer)
    put_rect(data, w, 2, 2, w - 4, h - 4, inner)
    put_rect(data, w, 4, 4, w - 8, h - 8, (15, 31, 50, 255))
    put_rect(data, w, 6, 6, w - 12, 2, accent)
    write_png(path, w, h, data)


def build_font(path):
    glyph_w = 6
    glyph_h = 8
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?+-/ '"
    cols = 8
    rows = (len(chars) + cols - 1) // cols
    w = cols * glyph_w
    h = rows * glyph_h
    data = rgba_canvas(w, h, (0, 0, 0, 0))
    fg = (255, 255, 255, 255)

    patterns = {
        "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
        "B": ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
        "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
        "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
        "E": ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
        "F": ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
        "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
        "H": ["10001", "10001", "11111", "10001", "10001", "10001", "10001"],
        "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
        "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
        "K": ["10001", "10010", "11100", "10010", "10001", "10001", "10001"],
        "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
        "M": ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
        "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
        "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
        "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
        "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
        "R": ["11110", "10001", "10001", "11110", "10010", "10001", "10001"],
        "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
        "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
        "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
        "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
        "W": ["10001", "10001", "10001", "10001", "10101", "11011", "10001"],
        "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
        "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
        "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
        "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
        "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
        "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
        "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
        "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
        "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
        "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
        "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
        "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
        "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
        ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
        ",": ["00000", "00000", "00000", "00000", "00110", "00110", "01100"],
        ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
        "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
        "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
        "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
        "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
        "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
        "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
        " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    }

    for idx, ch in enumerate(chars):
        ox = (idx % cols) * glyph_w
        oy = (idx // cols) * glyph_h
        pat = patterns.get(ch, patterns["?"])
        for y, row in enumerate(pat):
            for x, bit in enumerate(row):
                if bit == "1":
                    put_px(data, w, ox + x, oy + y, fg)

    write_png(path, w, h, data)


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    build_tileset(os.path.join(root, "apps/web-player/assets/sprites/tileset.png"))
    build_character(
        os.path.join(root, "apps/web-player/assets/sprites/unicorn_player.png"),
        (255, 255, 255, 255),
        (255, 119, 196, 255),
        False,
    )
    build_character(
        os.path.join(root, "apps/web-player/assets/sprites/unicorn_npc.png"),
        (247, 247, 255, 255),
        (255, 155, 212, 255),
        True,
    )
    build_panel(os.path.join(root, "apps/web-player/assets/ui/panel-9slice.png"))
    build_button(os.path.join(root, "apps/web-player/assets/ui/button-9slice.png"))
    build_font(os.path.join(root, "apps/web-player/assets/ui/font-6x8.png"))


if __name__ == "__main__":
    main()
