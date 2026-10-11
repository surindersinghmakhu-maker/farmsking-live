import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_full_details_doc():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)
        
    font_name = "Nirmala UI"
    primary_color = RGBColor(21, 128, 61)   # #15803D Forest Green
    dark_text = RGBColor(15, 23, 42)        # #0F172A Slate 900
    red_color = RGBColor(185, 28, 28)       # Red for risks/nuksan
    blue_color = RGBColor(30, 58, 138)      # Blue for synergy

    # Header
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("👑 ਫਾਰਮਜ਼ਕਿੰਗ ਇੰਡੀਆ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ\nFARMSKING INDIA PRIVATE LIMITED\n")
    r.font.name = font_name
    r.font.size = Pt(20)
    r.font.bold = True
    r.font.color.rgb = primary_color

    r2 = p.add_run("ਤਿੰਨਾਂ ਮੈਂਬਰਾਂ ਦੇ ਲਾਭ, ਨੁਕਸਾਨ, ਆਪਸੀ ਤਾਲਮੇਲ ਅਤੇ ਕੰਮਾਂ ਦੀ ਵੰਡ ਦਾ ਮੁਕੰਮਲ ਵੇਰਵਾ\n(Master Confidential Governance & Partnership Guide)")
    r2.font.name = font_name
    r2.font.size = Pt(11)
    r2.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Summary Table
    tbl = doc.add_table(rows=4, cols=5)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["ਮੈਂਬਰ ਦਾ ਨਾਮ", "ਕੰਪਨੀ ਅਹੁਦਾ", "ਸ਼ੇਅਰ %", "ਮੁੱਖ ਕਮਾਈ ਦਾ ਤਰੀਕਾ", "ਮੁੱਖ ਕਾਨੂੰਨੀ / ਵਪਾਰਕ ਭੂਮਿਕਾ"]
    for i, h in enumerate(headers):
        c = tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.name = font_name
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("ਸੁਰਿੰਦਰ ਸਿੰਘ", "ਮੁੱਖ ਸੰਸਥਾਪਕ / ਇਕੱਲਾ ਸ਼ੇਅਰਹੋਲਡਰ", "87%", "87% ਸਾਲਾਨਾ ਮੁਨਾਫ਼ਾ (ਡਿਵੀਡੈਂਡ) + ਕਰੋੜਾਂ ਦੀ ਇਕੁਇਟੀ ਸੰਪਤੀ", "100% ਸੁਪਰੀਮ ਕੰਟਰੋਲ (>75% ਵੀਟੋ ਪਾਵਰ), ਪੈਸਿਵ ਨਿਵੇਸ਼ਕ (0% ਤਨਖਾਹ, ਸਰਕਾਰੀ ਨੌਕਰੀ 100% ਸੁਰੱਖਿਅਤ)"),
        ("ਬਖਸ਼ੀਸ਼ ਸਿੰਘ", "ਐਗਜ਼ੈਕਟਿਵ ਵਰਕਿੰਗ ਡਾਇਰੈਕਟਰ 1", "10%", "ਮਹੀਨਾਵਾਰ ਪੱਕੀ ਤਨਖਾਹ + 10% ਸਾਲਾਨਾ ਮੁਨਾਫ਼ਾ", "ਮੰਡੀਆਂ, ਡੀਲਰ, ICICI ਬੈਂਕਿੰਗ, ਸੌਦੇਬਾਜ਼ੀ, ਕਾਨੂੰਨੀ ਡਾਇਰੈਕਟਰ ਰੁਤਬਾ (DIN)"),
        ("ਗਗਨਦੀਪ ਕੌਰ", "ਐਗਜ਼ੈਕਟਿਵ ਵਰਕਿੰਗ ਡਾਇਰੈਕਟਰ 2", "3%", "ਮਹੀਨਾਵਾਰ ਤਨਖਾਹ/ਭੱਤਾ + 3% ਸਾਲਾਨਾ ਮੁਨਾਫ਼ਾ", "ਦਫ਼ਤਰ, ਕੰਪਿਊਟਰ ਬਿਲਿੰਗ, ਗਾਹਕ ਸੇਵਾ, ਮਹਿਲਾ ਸਟਾਰਟਅੱਪ ਸਬਸਿਡੀਆਂ, ਡਾਇਰੈਕਟਰ (DIN)")
    ]

    for row_idx, data in enumerate(rows_data, start=1):
        for col_idx, text in enumerate(data):
            c = tbl.cell(row_idx, col_idx)
            if row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 90, 90)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = font_name
            run.font.size = Pt(9)
            run.font.color.rgb = dark_text
            if col_idx == 0:
                run.font.bold = True
            if col_idx == 2:
                run.font.bold = True
                run.font.color.rgb = primary_color

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 1: ALL BENEFITS (NAME-WISE)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("🟢 ਭਾਗ 1: ਸਾਰੇ ਲਾਭ (ALL BENEFITS) — ਨਾਮ-ਵਾਰ")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    # 1.1 Surinder Singh Benefits
    h2 = doc.add_heading(level=2)
    r = h2.add_run("1.1 ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦੇ ਲਾਭ (Surinder Singh — 87% Equity / Only Shareholder):")
    r.font.name = font_name
    r.font.size = Pt(11.5)
    r.font.color.rgb = dark_text

    p = doc.add_paragraph()
    p.add_run("1. 87% ਸਾਲਾਨਾ ਮੁਨਾਫ਼ਾ (Dividends): ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਵੱਲੋਂ ਸਾਲ ਦੇ ਅੰਤ ਵਿੱਚ ਜੋ ਵੀ ਸ਼ੁੱਧ ਲਾਭ (Net Profit) ਕੱਢਿਆ ਜਾਵੇਗਾ, ਉਸਦਾ 87% ਹਿੱਸਾ ਕਾਨੂੰਨੀ ਤੌਰ 'ਤੇ ਸਿੱਧਾ ਉਹਨਾਂ ਦੇ ਨਿੱਜੀ ਖਾਤੇ ਵਿੱਚ ਜਾਵੇਗਾ।\n")
    p.add_run("2. ਕਰੋੜਾਂ ਦੀ ਸੰਪਤੀ ਦਾ ਵਾਧਾ (Wealth Appreciation): ").font.bold = True
    p.add_run("ਜਿਵੇਂ-ਜਿਵੇਂ ਫਾਰਮਜ਼ਕਿੰਗ ਦੀ ਮਾਰਕੀਟ ਵੈਲਿਊ ਵਧੇਗੀ (ਮੰਨ ਲਓ ਕੰਪਨੀ ਦੀ ਵੈਲਿਊ ₹10 ਕਰੋੜ ਹੁੰਦੀ ਹੈ), ਤਾਂ ਉਹਨਾਂ ਦੇ 87% ਸ਼ੇਅਰਾਂ ਦੀ ਕੀਮਤ ₹8.70 ਕਰੋੜ ਦੀ ਨਿੱਜੀ ਜਾਇਦਾਦ ਬਣ ਜਾਵੇਗੀ।\n")
    p.add_run("3. 100% ਸੁਪਰੀਮ ਕੰਟਰੋਲ (Absolute Veto Power): ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਕਾਨੂੰਨ ਅਨੁਸਾਰ ਵੱਡੇ ਫੈਸਲੇ ਲੈਣ ਲਈ 75% ਵੋਟ ਚਾਹੀਦੀ ਹੁੰਦੀ ਹੈ। ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਕੋਲ 87% ਇਕੁਇਟੀ ਹੈ, ਯਾਨੀ ਉਹਨਾਂ ਦੀ ਲਿਖਤੀ ਮਨਜ਼ੂਰੀ ਤੋਂ ਬਿਨਾਂ ਕੰਪਨੀ ਦਾ ਕੋਈ ਨਿਯਮ, ਡਾਇਰੈਕਟਰ ਜਾਂ ਸਾਫਟਵੇਅਰ ਨਹੀਂ ਬਦਲਿਆ ਜਾ ਸਕਦਾ।\n")
    p.add_run("4. ਸਰਕਾਰੀ ਨੌਕਰੀ 100% ਸੁਰੱਖਿਅਤ (Civil Services Rule 16 Compliant): ").font.bold = True
    p.add_run("ਸਰਕਾਰੀ ਮੁਲਾਜ਼ਮ ਕੰਪਨੀ ਵਿੱਚ ਡਾਇਰੈਕਟਰ ਨਹੀਂ ਬਣ ਸਕਦਾ ਅਤੇ ਤਨਖਾਹ ਨਹੀਂ ਲੈ ਸਕਦਾ। ਪਰ ਨਿਵੇਸ਼ਕ ਵਜੋਂ ਸ਼ੇਅਰ ਖਰੀਦ ਸਕਦਾ ਹੈ। ਉਹ ਕੰਪਨੀ ਵਿੱਚ 0% ਤਨਖਾਹ ਅਤੇ ਸਿਰਫ਼ ਸ਼ੇਅਰਹੋਲਡਰ ਹਨ, ਇਸ ਲਈ ਉਹਨਾਂ ਦੀ ਸਰਕਾਰੀ ਨੌਕਰੀ 'ਤੇ 1% ਵੀ ਕੋਈ ਕਾਨੂੰਨੀ ਖ਼ਤਰਾ ਨਹੀਂ ਹੈ।\n")
    p.add_run("5. ਸ਼ੇਅਰ ਸੁਰੱਖਿਆ (Right of First Refusal): ").font.bold = True
    p.add_run("ਬਾਕੀ ਦੋਵੇਂ ਡਾਇਰੈਕਟਰ ਆਪਣੇ ਸ਼ੇਅਰ ਕਿਸੇ ਬਾਹਰਲੇ ਬੰਦੇ ਨੂੰ ਨਹੀਂ ਵੇਚ ਸਕਦੇ, ਪਹਿਲਾਂ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਨੂੰ ਹੀ ਪੇਸ਼ ਕਰਨੇ ਪੈਣਗੇ।\n")

    # 1.2 Bakshish Singh Benefits
    h2 = doc.add_heading(level=2)
    r = h2.add_run("1.2 ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਦੇ ਲਾਭ (Bakshish Singh — 10% Equity & Director 1):")
    r.font.name = font_name
    r.font.size = Pt(11.5)
    r.font.color.rgb = dark_text

    p = doc.add_paragraph()
    p.add_run("1. ਮਹੀਨਾਵਾਰ ਪੱਕੀ ਤਨਖਾਹ (Director Monthly Salary): ").font.bold = True
    p.add_run("ਵਰਕਿੰਗ ਡਾਇਰੈਕਟਰ ਹੋਣ ਦੇ ਨਾਤੇ ਉਹ ਕੰਪਨੀ ਦੇ ਖਾਤੇ (ICICI Bank) ਵਿੱਚੋਂ ਹਰ ਮਹੀਨੇ ਕਾਨੂੰਨੀ ਤਨਖਾਹ / ਮਾਣਭੱਤਾ ਲੈਣ ਦੇ ਹੱਕਦਾਰ ਹੋਣਗੇ, ਜੋ ਕੰਪਨੀ ਦੇ ਮੁਨਾਫ਼ੇ ਤੋਂ ਪਹਿਲਾਂ ਖਰਚੇ ਵਜੋਂ ਨਿਕਲਦੀ ਹੈ।\n")
    p.add_run("2. 10% ਸਾਲਾਨਾ ਮੁਨਾਫ਼ਾ (Annual Dividends): ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਦੇ ਸਾਲਾਨਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ੇ ਵਿੱਚੋਂ 10% ਹਿੱਸਾ ਹਰ ਸਾਲ ਵਾਧੂ ਬੋਨਸ ਵਜੋਂ ਸਿੱਧਾ ਉਹਨਾਂ ਦੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਆਵੇਗਾ।\n")
    p.add_run("3. ਸਰਕਾਰੀ ਡਾਇਰੈਕਟਰ ਰੁਤਬਾ (MCA DIN Holder): ").font.bold = True
    p.add_run("ਭਾਰਤ ਸਰਕਾਰ ਦੇ ਰਿਕਾਰਡ ਵਿੱਚ ਕੰਪਨੀ ਦੇ ਅਧਿਕਾਰਤ ਡਾਇਰੈਕਟਰ ਵਜੋਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਹੋਵੇਗੀ, ਜੋ ਸਮਾਜ, ਮੰਡੀ ਅਤੇ ਬੈਂਕਾਂ ਵਿੱਚ ਬਹੁਤ ਵੱਡਾ ਵੱਕਾਰ ਦਿੰਦਾ ਹੈ।\n")
    p.add_run("4. ਬੈਂਕਿੰਗ ਅਤੇ ਦਸਤਖਤੀ ਅਧਿਕਾਰ (Banking Powers): ").font.bold = True
    p.add_run("ICICI Bank ਵਿੱਚ ਕੰਪਨੀ ਦਾ ਕਰੰਟ ਅਕਾਊਂਟ ਚਲਾਉਣਾ, ਚੈੱਕ ਸਾਈਨ ਕਰਨਾ, ਖਾਦ-ਬੀਜ ਦੇ ਸੌਦੇ ਅਤੇ ਕੰਟਰੈਕਟ ਸਾਈਨ ਕਰਨ ਦਾ ਪੂਰਾ ਅਧਿਕਾਰ।\n")
    p.add_run("5. ਬੈਂਕ ਲੋਨ ਅਤੇ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਸੁਵਿਧਾ: ").font.bold = True
    p.add_run("ਰਜਿਸਟਰਡ ਡਾਇਰੈਕਟਰ ਹੋਣ ਅਤੇ ਕੰਪਨੀ ਤੋਂ ਨਿਯਮਤ ਤਨਖਾਹ ਆਉਣ ਕਾਰਨ ਬੈਂਕਾਂ ਤੋਂ ਆਸਾਨੀ ਨਾਲ ਨਿੱਜੀ ਲੋਨ, ਕਾਰ ਲੋਨ ਜਾਂ ਕਾਰੋਬਾਰੀ ਕ੍ਰੈਡਿਟ ਮਿਲ ਸਕੇਗਾ।\n")

    # 1.3 Gagandeep Kaur Benefits
    h2 = doc.add_heading(level=2)
    r = h2.add_run("1.3 ਗਗਨਦੀਪ ਕੌਰ ਜੀ ਦੇ ਲਾਭ (Gagandeep Kaur — 3% Equity & Director 2):")
    r.font.name = font_name
    r.font.size = Pt(11.5)
    r.font.color.rgb = dark_text

    p = doc.add_paragraph()
    p.add_run("1. ਮਹੀਨਾਵਾਰ ਤਨਖਾਹ / ਕਾਰਜਕਾਰੀ ਭੱਤਾ: ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਦੀ ਕਾਰਜਕਾਰੀ ਮਹਿਲਾ ਡਾਇਰੈਕਟਰ ਵਜੋਂ ਹਰ ਮਹੀਨੇ ਕੰਪਨੀ ਖਾਤੇ ਵਿੱਚੋਂ ਤਨਖਾਹ ਜਾਂ ਮੀਟਿੰਗ ਭੱਤਾ ਲੈਣ ਦੀ ਪੂਰੀ ਕਾਨੂੰਨੀ ਹੱਕਦਾਰੀ।\n")
    p.add_run("2. 3% ਸਾਲਾਨਾ ਮੁਨਾਫ਼ਾ (Annual Dividends): ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਦੇ ਸਾਲਾਨਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ੇ ਵਿੱਚੋਂ 3% ਹਿੱਸਾ ਡਿਵੀਡੈਂਡ ਵਜੋਂ ਸਿੱਧਾ ਉਹਨਾਂ ਦੇ ਨਿੱਜੀ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਹੋਵੇਗਾ।\n")
    p.add_run("3. ਸਰਕਾਰੀ ਮਹਿਲਾ ਉੱਦਮੀ ਸਬਸਿਡੀਆਂ (Women Entrepreneur Privileges): ").font.bold = True
    p.add_run("ਕੇਂਦਰ ਅਤੇ ਪੰਜਾਬ ਸਰਕਾਰ ਵੱਲੋਂ ਮਹਿਲਾ ਡਾਇਰੈਕਟਰਾਂ ਵਾਲੀਆਂ ਕੰਪਨੀਆਂ ਨੂੰ ਮਿਲਣ ਵਾਲੀਆਂ ਵਿਸ਼ੇਸ਼ ਸਬਸਿਡੀਆਂ (ਜਿਵੇਂ ਮੁਦਰਾ ਲੋਨ, Stand-Up India ਸਕੀਮ, ਅਤੇ ਸਟਾਰਟਅੱਪ ਗ੍ਰਾਂਟਾਂ) ਵਿੱਚ ਉਹ ਕੰਪਨੀ ਦਾ ਮੁੱਖ ਚਿਹਰਾ ਹੋਣਗੇ।\n")
    p.add_run("4. ਆਜ਼ਾਦ ਕਾਰਪੋਰੇਟ ਰੁਤਬਾ (Woman Director): ").font.bold = True
    p.add_run("ਭਾਰਤ ਸਰਕਾਰ (MCA) ਵਿੱਚ ਅਧਿਕਾਰਤ ਡਾਇਰੈਕਟਰ (DIN ਧਾਰਕ) ਹੋਣ ਦਾ ਉੱਚਾ ਸਮਾਜਿਕ ਮਾਣ-ਸਨਮਾਨ ਅਤੇ ਸੁਤੰਤਰ ਕਾਰੋਬਾਰੀ ਪਛਾਣ।\n")
    p.add_run("5. ਬੋਰਡ ਮੀਟਿੰਗਾਂ ਵਿੱਚ ਬਰਾਬਰ ਦੀ ਵੋਟ: ").font.bold = True
    p.add_run("ਬੋਰਡ ਆਫ ਡਾਇਰੈਕਟਰਜ਼ ਦੀ ਹਰ ਮੀਟਿੰਗ ਵਿੱਚ ਬਰਾਬਰ ਦੇ ਡਾਇਰੈਕਟਰ ਵਜੋਂ ਸ਼ਾਮਲ ਹੋਣਾ ਅਤੇ ਫੈਸਲਿਆਂ ਵਿੱਚ ਹਿੱਸਾ ਲੈਣਾ।\n")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 2: ALL RISKS / NUKSAN (NAME-WISE)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("🔴 ਭਾਗ 2: ਸਾਰੇ ਨੁਕਸਾਨ ਅਤੇ ਸੰਭਾਵੀ ਰਿਸਕ (RISKS & LIABILITIES) — ਨਾਮ-ਵਾਰ")
    r.font.name = font_name
    r.font.color.rgb = red_color
    r.font.size = Pt(14)
    r.font.bold = True

    # 2.1 Surinder Singh Risks
    h2 = doc.add_heading(level=2)
    r = h2.add_run("2.1 ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਲਈ ਨੁਕਸਾਨ / ਰਿਸਕ:")
    r.font.name = font_name
    r.font.size = Pt(11.5)
    r.font.color.rgb = dark_text

    p = doc.add_paragraph()
    p.add_run("1. ਕੋਈ ਮਹੀਨਾਵਾਰ ਤਨਖਾਹ ਨਹੀਂ (No Fixed Monthly Salary): ").font.bold = True
    p.add_run("ਉਹ ਕੰਪਨੀ ਵਿੱਚੋਂ ਤਨਖਾਹ ਨਹੀਂ ਕੱਢ ਸਕਦੇ। ਜੇਕਰ ਕੰਪਨੀ ਸ਼ੁਰੂਆਤੀ ਮਹੀਨਿਆਂ ਵਿੱਚ ਮੁਨਾਫ਼ਾ ਨਹੀਂ ਕਮਾਉਂਦੀ, ਤਾਂ ਉਹਨਾਂ ਨੂੰ ਉਸ ਸਮੇਂ ਕੋਈ ਨਿਯਮਤ ਮਹੀਨਾਵਾਰ ਆਮਦਨ ਨਹੀਂ ਹੋਵੇਗੀ (ਸਿਰਫ਼ ਸਾਲਾਨਾ ਮੁਨਾਫ਼ੇ ਵਿੱਚੋਂ ਹੀ ਪੈਸਾ ਆਵੇਗਾ)।\n")
    p.add_run("2. ਡਾਇਰੈਕਟਰਾਂ 'ਤੇ ਨਿਰਭਰਤਾ (Signatory Dependency): ").font.bold = True
    p.add_run("ਸਰਕਾਰੀ ਨੌਕਰੀ ਕਾਰਨ ਉਹ ਖ਼ੁਦ ਬੈਂਕ ਚੈੱਕ ਜਾਂ ਸਰਕਾਰੀ ਕਾਗਜ਼ਾਂ 'ਤੇ ਡਾਇਰੈਕਟਰ ਵਜੋਂ ਸਾਈਨ ਨਹੀਂ ਕਰ ਸਕਦੇ। ਕੰਮ ਕਰਵਾਉਣ ਲਈ ਉਹਨਾਂ ਨੂੰ ਦੂਜੇ ਦੋ ਡਾਇਰੈਕਟਰਾਂ (ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਤੇ ਗਗਨਦੀਪ ਕੌਰ) 'ਤੇ ਨਿਰਭਰ ਰਹਿਣਾ ਪਵੇਗਾ।\n")
    p.add_run("3. ਬਿਜ਼ਨਸ ਪੂੰਜੀ ਦਾ ਰਿਸਕ: ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਨੂੰ ਸ਼ੁਰੂ ਕਰਨ ਵਿੱਚ ਲੱਗਿਆ ਪੈਸਾ ਅਤੇ ਸਾਫਟਵੇਅਰ ਦੀ ਲਾਗਤ ਦਾ ਮੁੱਖ ਵਿੱਤੀ ਬੋਝ ਉਹਨਾਂ ਦੇ ਸਿਰ 'ਤੇ ਹੋਵੇਗਾ।\n")

    # 2.2 Bakshish Singh Risks
    h2 = doc.add_heading(level=2)
    r = h2.add_run("2.2 ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਲਈ ਨੁਕਸਾਨ / ਰਿਸਕ:")
    r.font.name = font_name
    r.font.size = Pt(11.5)
    r.font.color.rgb = dark_text

    p = doc.add_paragraph()
    p.add_run("1. ਸਰਕਾਰੀ ਕਾਨੂੰਨਾਂ ਦੀ ਨਿੱਜੀ ਜ਼ਿੰਮੇਵਾਰੀ (Legal Liability for MCA & GST): ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਦੇ ਡਾਇਰੈਕਟਰ ਹੋਣ ਕਰਕੇ ਜੇਕਰ ਕੰਪਨੀ ਸਮੇਂ ਸਿਰ GST, TDS ਜਾਂ MCA ਦੀ ਸਾਲਾਨਾ ਰਿਟਰਨ ਨਹੀਂ ਭਰਦੀ, ਤਾਂ ਸਰਕਾਰੀ ਨੋਟਿਸ ਅਤੇ ਜੁਰਮਾਨਾ ਡਾਇਰੈਕਟਰ ਦੇ ਨਾਮ 'ਤੇ ਆਉਂਦਾ ਹੈ।\n")
    p.add_run("2. ਚੈੱਕ ਬਾਊਂਸ ਦੀ ਕਾਨੂੰਨੀ ਜ਼ਿੰਮੇਵਾਰੀ (Section 138 NI Act): ").font.bold = True
    p.add_run("ਬੈਂਕ ਚੈੱਕ ਸਾਈਨ ਕਰਨ ਦਾ ਅਧਿਕਾਰ ਉਹਨਾਂ ਕੋਲ ਹੋਵੇਗਾ। ਜੇਕਰ ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ ਨਾ ਹੋਣ ਅਤੇ ਚੈੱਕ ਬਾਊਂਸ ਹੋ ਜਾਵੇ, ਤਾਂ ਕਾਨੂੰਨੀ ਕੇਸ ਸਾਈਨ ਕਰਨ ਵਾਲੇ ਡਾਇਰੈਕਟਰ 'ਤੇ ਬਣਦਾ ਹੈ (ਇਸ ਲਈ ਬਿਨਾਂ ਪੈਸਿਆਂ ਤੋਂ ਚੈੱਕ ਕਦੇ ਨਹੀਂ ਕੱਟਣਾ ਚਾਹੀਦਾ)।\n")
    p.add_run("3. ਜ਼ਮੀਨੀ ਭੱਜ-ਦੌੜ ਅਤੇ ਮਿਹਨਤ: ").font.bold = True
    p.add_run("ਮੰਡੀਆਂ, ਡੀਲਰਾਂ, ਸਪਲਾਇਰਾਂ ਅਤੇ ਡਿਲੀਵਰੀ ਦਾ ਔਖਾ ਜ਼ਮੀਨੀ ਕੰਮ ਉਹਨਾਂ ਨੂੰ ਖ਼ੁਦ ਸੰਭਾਲਣਾ ਪਵੇਗਾ।\n")
    p.add_run("4. ਫੈਸਲਿਆਂ ਵਿੱਚ ਵੀਟੋ ਪਾਵਰ ਨਹੀਂ: ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਦੇ ਵੱਡੇ ਨੀਤੀਗਤ ਫੈਸਲਿਆਂ ਵਿੱਚ ਉਹਨਾਂ ਕੋਲ ਸਿਰਫ਼ 10% ਵੋਟ ਹੈ, ਇਸ ਲਈ ਉਹ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦੀ ਮਰਜ਼ੀ ਤੋਂ ਉਲਟ ਜਾ ਕੇ ਕੋਈ ਵੱਡਾ ਫੈਸਲਾ ਨਹੀਂ ਲੈ ਸਕਦੇ।\n")

    # 2.3 Gagandeep Kaur Risks
    h2 = doc.add_heading(level=2)
    r = h2.add_run("2.3 ਗਗਨਦੀਪ ਕੌਰ ਜੀ ਲਈ ਨੁਕਸਾਨ / ਰਿਸਕ:")
    r.font.name = font_name
    r.font.size = Pt(11.5)
    r.font.color.rgb = dark_text

    p = doc.add_paragraph()
    p.add_run("1. ਸੰਯੁਕਤ ਡਾਇਰੈਕਟਰ ਜ਼ਿੰਮੇਵਾਰੀ: ").font.bold = True
    p.add_run("ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਵਾਂਗ ਉਹ ਵੀ ਕੰਪਨੀ ਦੇ ਕਾਨੂੰਨੀ ਕਾਗਜ਼ਾਤਾਂ ਅਤੇ ਲਾਇਸੰਸਾਂ ਲਈ ਕਾਗਜ਼ੀ ਤੌਰ 'ਤੇ ਜਵਾਬਦੇਹ ਹੋਣਗੇ।\n")
    p.add_run("2. ਘੱਟ ਵੋਟਿੰਗ ਪਾਵਰ (3% Equity): ").font.bold = True
    p.add_run("ਸ਼ੇਅਰ ਸਿਰਫ਼ 3% ਹੋਣ ਕਰਕੇ ਬੋਰਡ ਵਿੱਚ ਉਹਨਾਂ ਕੋਲ ਵੱਡੇ ਫੈਸਲੇ ਬਦਲਣ ਦੀ ਸੁਤੰਤਰ ਤਾਕਤ ਨਹੀਂ ਹੋਵੇਗੀ।\n")
    p.add_run("3. ਗਾਹਕਾਂ ਦੀਆਂ ਸ਼ਿਕਾਇਤਾਂ ਦਾ ਦਬਾਅ: ").font.bold = True
    p.add_run("ਦਫ਼ਤਰ ਅਤੇ ਕਸਟਮਰ ਕੇਅਰ ਸੰਭਾਲਣ ਕਾਰਨ ਕਿਸਾਨਾਂ ਜਾਂ ਗਾਹਕਾਂ ਦੀਆਂ ਰੋਜ਼ਾਨਾ ਸ਼ਿਕਾਇਤਾਂ ਅਤੇ ਕਾਲਾਂ ਸੁਣਨ ਦਾ ਮਾਨਸਿਕ ਦਬਾਅ ਰਹੇਗਾ।\n")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 3: MUTUAL SYNERGY (NAME-WISE)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("🤝 ਭਾਗ 3: ਤਿੰਨਾਂ ਦਾ ਆਪਸੀ ਤਾਲਮੇਲ (MUTUAL SYNERGY) — ਨਾਮ-ਵਾਰ")
    r.font.name = font_name
    r.font.color.rgb = blue_color
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run("ਇਹ ਕੰਪਨੀ ਇੱਕ ਰੱਥ ਵਾਂਗ ਹੈ, ਜਿਸ ਵਿੱਚ ਤਿੰਨਾਂ ਦੀ ਭੂਮਿਕਾ ਬਿਲਕੁਲ ਵੱਖਰੀ ਅਤੇ ਸੰਪੂਰਨ ਹੈ:\n").font.italic = True
    p.add_run("• ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਕੰਪਨੀ ਦਾ 'ਦਿਮਾਗ ਅਤੇ ਨੀਂਹ' ਹਨ: ").font.bold = True
    p.add_run("ਉਹ ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਨੂੰ ਫੀਲਡ ਦਾ ਰੋਡਮੈਪ ਦੇਣਗੇ ਅਤੇ ਗਗਨਦੀਪ ਕੌਰ ਨੂੰ ਦਫ਼ਤਰੀ ਸਿਸਟਮ ਸਮਝਾਉਣਗੇ। ਵਿੱਤੀ ਅਤੇ ਤਕਨੀਕੀ ਫੈਸਲੇ ਉਹਨਾਂ ਦੀ ਅਗਵਾਈ ਹੇਠ ਹੋਣਗੇ।\n")
    p.add_run("• ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਕੰਪਨੀ ਦੇ 'ਹੱਥ-ਪੈਰ ਅਤੇ ਜ਼ਮੀਨੀ ਤਾਕਤ' ਹਨ: ").font.bold = True
    p.add_run("ਉਹ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦੀ ਪਲੈਨਿੰਗ ਨੂੰ ਮੰਡੀ ਵਿੱਚ ਲਾਗੂ ਕਰਨਗੇ ਅਤੇ ਗਗਨਦੀਪ ਕੌਰ ਵੱਲੋਂ ਆਏ ਆਰਡਰਾਂ ਦਾ ਸਮਾਨ ਡੀਲਰਾਂ ਤੋਂ ਚੁੱਕ ਕੇ ਡਿਲੀਵਰ ਕਰਵਾਉਣਗੇ।\n")
    p.add_run("• ਗਗਨਦੀਪ ਕੌਰ ਜੀ ਕੰਪਨੀ ਦਾ 'ਦਿਲ ਅਤੇ ਦਫ਼ਤਰੀ ਪ੍ਰਬੰਧ' ਹਨ: ").font.bold = True
    p.add_run("ਉਹ ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਨੂੰ ਫੀਲਡ ਆਰਡਰਾਂ ਦੀ ਜਾਣਕਾਰੀ ਦੇਣਗੇ ਅਤੇ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਨੂੰ ਰੋਜ਼ਾਨਾ ਵਿਕਰੀ ਅਤੇ ਗਾਹਕਾਂ ਦੇ ਰੁਝਾਨ ਦੀ ਰਿਪੋਰਟ ਦੇਣਗੇ।\n")
    p.add_run("• ਕੋਈ ਟਕਰਾਅ ਨਹੀਂ: ").font.bold = True
    p.add_run("ਕੰਮਾਂ ਦੀ ਵੰਡ ਬਿਲਕੁਲ ਸਾਫ਼ ਹੋਣ ਕਰਕੇ ਕਿਸੇ ਦੇ ਕੰਮ ਵਿੱਚ ਦੂਜੇ ਦਾ ਬੇਲੋੜਾ ਦਖ਼ਲ ਨਹੀਂ ਹੋਵੇਗਾ।\n")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 4: ROLES & RESPONSIBILITIES (NAME-WISE)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("🛠️ ਭਾਗ 4: ਕੰਮਾਂ ਦੀ ਵੰਡ (ROLES & DUTIES) — ਨਾਮ-ਵਾਰ")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run("👤 4.1 ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦੇ ਕੰਮ:\n").font.bold = True
    p.add_run("• ਸਾਫਟਵੇਅਰ ਅਤੇ ਐਪ ਪ੍ਰਬੰਧਨ: ਫਾਰਮਜ਼ਕਿੰਗ ਐਪ, ਵੈੱਬਸਾਈਟ, AI ਕਰੌਪ ਡਾਕਟਰ ਅਤੇ ਸੈਟੇਲਾਈਟ ਫੀਚਰਾਂ ਦੀ ਤਕਨੀਕੀ ਦੇਖ-ਰੇਖ।\n")
    p.add_run("• ਵਿੱਤੀ ਨਿਗਰਾਨੀ: ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ ਤੋਂ ਰੋਜ਼ਾਨਾ ਮੁਨਾਫ਼ਾ, ਖਰਚੇ ਅਤੇ ਵਾਲਿਟ ਟ੍ਰਾਂਸਫਰ ਚੈੱਕ ਕਰਨਾ।\n")
    p.add_run("• ਲੀਗਲ ਤੇ CA ਮਾਰਗਦਰਸ਼ਨ: ਸੀਏ ਨਾਲ ਰਾਬਤਾ ਰੱਖ ਕੇ ਕੰਪਨੀ ਦੇ ਟੈਕਸ ਅਤੇ ਸਾਲਾਨਾ ਆਡਿਟ ਸਹੀ ਸਮੇਂ 'ਤੇ ਕਰਵਾਉਣਾ।\n\n")

    p.add_run("👤 4.2 ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਦੇ ਕੰਮ:\n").font.bold = True
    p.add_run("• ਡੀਲਰ ਅਤੇ ਵੈਂਡਰ ਨੈੱਟਵਰਕ: ਖਾਦ, ਬੀਜ, ਸਪਰੇਅ ਪੰਪ ਅਤੇ ਨਰਸਰੀ ਵਾਲਿਆਂ ਨਾਲ ਮਿਲ ਕੇ ਥੋਕ ਭਾਅ 'ਤੇ ਸਮਾਨ ਦੇ ਸੌਦੇ ਤੈਅ ਕਰਨੇ।\n")
    p.add_run("• ਮੰਡੀ ਰੇਟ ਅਤੇ ਡਿਲੀਵਰੀ ਸਿਸਟਮ: ਰੋਜ਼ਾਨਾ ਅਨਾਜ ਮੰਡੀਆਂ ਦੇ ਰੇਟ ਤਸਦੀਕ ਕਰਨੇ ਅਤੇ ਡਿਲੀਵਰੀ ਆਪਰੇਟਰਾਂ ਦਾ ਪ੍ਰਬੰਧ ਕਰਨਾ।\n")
    p.add_run("• ICICI ਬੈਂਕਿੰਗ ਕੰਮ: ਕੰਪਨੀ ਦੇ ਖਾਤੇ ਵਿੱਚ ਚੈੱਕ ਲਗਾਉਣਾ, ਨਕਦੀ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣਾ ਅਤੇ ਵੈਂਡਰਾਂ ਨੂੰ ਪੇਮੈਂਟਾਂ ਜਾਰੀ ਕਰਨੀਆਂ।\n\n")

    p.add_run("👤 4.3 ਗਗਨਦੀਪ ਕੌਰ ਜੀ ਦੇ ਕੰਮ:\n").font.bold = True
    p.add_run("• ਦਫ਼ਤਰੀ ਪ੍ਰਬੰਧ ਅਤੇ ਗਾਹਕ ਸੇਵਾ: ਕੰਪਨੀ ਦੇ ਫੋਨ/ਹੈਲਪਲਾਈਨ ਸੰਭਾਲਣਾ, ਕਿਸਾਨਾਂ ਅਤੇ ਗਾਰਡਨਰਾਂ ਦੀਆਂ ਮੁਸ਼ਕਲਾਂ ਹੱਲ ਕਰਨੀਆਂ।\n")
    p.add_run("• ਆਰਡਰ ਅਤੇ ਬਿਲਿੰਗ: ਮੋਬਾਈਲ ਐਪ 'ਤੇ ਆਏ ਆਰਡਰਾਂ ਦੇ ਕੰਪਿਊਟਰਾਈਜ਼ਡ ਬਿੱਲ (GST Invoices) ਕੱਟਣਾ ਅਤੇ ਪੈਕਿੰਗ ਯਕੀਨੀ ਬਣਾਉਣਾ।\n")
    p.add_run("• ਮਹਿਲਾ ਭਲਾਈ ਅਤੇ ਸਿੱਖਿਆ ਮੁਹਿੰਮਾਂ: ਪਿੰਡਾਂ ਵਿੱਚ ਮਹਿਲਾ ਕਿਸਾਨਾਂ ਲਈ ਕਿਚਨ ਗਾਰਡਨਿੰਗ ਅਤੇ 'ਲੋਕ ਭਲਾਈ' ਸਿਖਲਾਈ ਪ੍ਰੋਗਰਾਮਾਂ ਦਾ ਤਾਲਮੇਲ ਕਰਨਾ।\n")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 5: IMPORTANT STRATEGIC TIPS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("💡 ਭਾਗ 5: ਹੋਰ ਅਹਿਮ ਜਾਣਕਾਰੀਆਂ ਅਤੇ ਸਾਵਧਾਨੀਆਂ (IMPORTANT STRATEGIC TIPS)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run("1. ਤਨਖਾਹ ਕਦੋਂ ਸ਼ੁਰੂ ਕਰਨੀ ਹੈ? ").font.bold = True
    p.add_run("ਸ਼ੁਰੂਆਤੀ 2-3 ਮਹੀਨੇ ਕੰਪਨੀ ਦੀ ਸਥਾਪਨਾ 'ਤੇ ਲੱਗਦੇ ਹਨ। ਜਿਵੇਂ ਹੀ ਫਾਰਮਜ਼ਕਿੰਗ ਦੇ ਆਰਡਰ ਅਤੇ ਕੂਪਨ ਵਿਕਣ ਲੱਗਣ, ਬੋਰਡ ਮੀਟਿੰਗ ਵਿੱਚ ਮਤਾ ਪਾਸ ਕਰਕੇ ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਅਤੇ ਗਗਨਦੀਪ ਕੌਰ ਜੀ ਦੀ ਫਿਕਸ ਮਾਸਿਕ ਤਨਖਾਹ ਸ਼ੁਰੂ ਕੀਤੀ ਜਾਵੇਗੀ।\n\n")
    p.add_run("2. ICICI ਬੈਂਕ ਚੈੱਕ ਬੁੱਕ ਦਾ ਸੁਰੱਖਿਅਤ ਨਿਯਮ: ").font.bold = True
    p.add_run("ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਬਖਸ਼ੀਸ਼ ਸਿੰਘ ਜੀ ਦੇ ਸਾਈਨ ਹੋਣਗੇ, ਪਰ ਨਿਯਮ ਰੱਖਿਆ ਜਾਵੇ ਕਿ ₹25,000 ਜਾਂ ₹50,000 ਤੋਂ ਉੱਪਰ ਦਾ ਕੋਈ ਵੀ ਚੈੱਕ ਕੱਟਣ ਤੋਂ ਪਹਿਲਾਂ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦੀ ਵਟਸਐਪ ਜਾਂ ਫੋਨ 'ਤੇ ਸਹਿਮਤੀ ਲਾਜ਼ਮੀ ਹੋਵੇਗੀ। ਇਸ ਨਾਲ ਕਦੇ ਕੋਈ ਵਿੱਤੀ ਗੜਬੜ ਨਹੀਂ ਹੋਵੇਗੀ।\n\n")
    p.add_run("3. CA ਕੋਲ ਸਮੇਂ ਸਿਰ ਬਿੱਲ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣਾ: ").font.bold = True
    p.add_run("ਹਰ ਮਹੀਨੇ ਦੀ 10 ਤਰੀਕ ਤੱਕ ਸਾਰੇ ਬਿੱਲ CA ਨੂੰ ਭੇਜਣੇ ਜ਼ਰੂਰੀ ਹਨ ਤਾਂ ਜੋ GST ਰਿਟਰਨ ਲੇਟ ਨਾ ਹੋਵੇ ਅਤੇ ਡਾਇਰੈਕਟਰਾਂ 'ਤੇ ਕੋਈ ਸਰਕਾਰੀ ਜੁਰਮਾਨਾ ਨਾ ਲੱਗੇ।\n\n")
    p.add_run("4. ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦੀ ਸਰਕਾਰੀ ਸੁਰੱਖਿਆ: ").font.bold = True
    p.add_run("ਕੰਪਨੀ ਰਜਿਸਟਰ ਹੁੰਦੇ ਸਾਰ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਆਪਣੇ ਵਿਭਾਗ ਦੇ ਮੁਖੀ (HOD) ਨੂੰ ਸਾਦੀ ਸੂਚਨਾ ਚਿੱਠੀ ਦੇਣਗੇ ਕਿ ਉਹ ਕੰਪਨੀ ਵਿੱਚ ਸਿਰਫ਼ ਨਿਵੇਸ਼ਕ/ਸ਼ੇਅਰਹੋਲਡਰ ਹਨ ਅਤੇ ਕੋਈ ਤਨਖਾਹ ਜਾਂ ਅਹੁਦਾ ਨਹੀਂ ਰੱਖਦੇ। ਇਸ ਨਾਲ ਉਹਨਾਂ ਦੀ ਨੌਕਰੀ ਪੂਰੀ ਤਰ੍ਹਾਂ ਨਿਸ਼ਚਿੰਤ ਰਹੇਗੀ।\n")

    # Footer note
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_p.add_run("👑 ਫਾਰਮਜ਼ਕਿੰਗ ਇੰਡੀਆ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ — ਸਫਲਤਾ, ਏਕਤਾ ਅਤੇ ਪਾਰਦਰਸ਼ਤਾ ਦਾ ਪ੍ਰਤੀਕ")
    footer_run.font.name = font_name
    footer_run.font.size = Pt(10.5)
    footer_run.font.bold = True
    footer_run.font.color.rgb = primary_color

    dest_desktop1 = r"C:\Users\hp\Desktop\farmsking_tinne_person_details.docx"
    dest_desktop2 = r"C:\Users\hp\Desktop\farmsking_members_benefits.docx"
    dest_local = r"d:\FarmsKing\farmsking_tinne_person_details.docx"

    doc.save(dest_desktop1)
    doc.save(dest_desktop2)
    doc.save(dest_local)
    print(f"Successfully saved to Desktop: {dest_desktop1}")

if __name__ == "__main__":
    create_full_details_doc()
