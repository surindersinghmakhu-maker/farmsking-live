import os
import sys
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

def create_punjabi_document():
    doc = Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    primary_color = RGBColor(21, 128, 61)   # #15803D Forest Green
    dark_text = RGBColor(15, 23, 42)        # #0F172A Slate 900
    sub_color = RGBColor(71, 85, 105)       # #475569 Slate 600
    font_name = "Nirmala UI"                # Perfect Windows Gurmukhi font, fallback to Calibri

    # Document Header
    p_head = doc.add_paragraph()
    p_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_head.add_run("👑 ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ\nFARMSKING TECHNOLOGIES PRIVATE LIMITED\n")
    r_title.font.name = font_name
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = primary_color

    r_sub = p_head.add_run("ਕੰਪਨੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਤੇ ਸੀਏ (CA / CS) ਲਈ ਮੁਕੰਮਲ ਕਾਨੂੰਨੀ ਚਾਰਟਰ ਦਸਤਾਵੇਜ਼\n(ਭਾਰਤੀ ਕੰਪਨੀ ਕਾਨੂੰਨ 2013 ਅਤੇ MCA SPICe+ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਮਾਸਟਰ ਖਰੜਾ)")
    r_sub.font.name = font_name
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = sub_color

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Executive Summary Box
    callout_tbl = doc.add_table(rows=1, cols=1)
    callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_box = callout_tbl.cell(0, 0)
    set_cell_background(c_box, "F0FDF4")
    set_cell_margins(c_box, top=140, bottom=140, left=200, right=200)

    cp = c_box.paragraphs[0]
    cp_run1 = cp.add_run("📌 ਕੰਪਨੀ ਦਾ ਮੁੱਖ ਮੰਤਵ ਅਤੇ ਸੀਏ (CA) ਲਈ ਸੰਖੇਪ ਸਾਰ:\n")
    cp_run1.font.name = font_name
    cp_run1.font.bold = True
    cp_run1.font.size = Pt(11.5)
    cp_run1.font.color.rgb = primary_color

    cp_run2 = cp.add_run(
        "ਇਹ ਦਸਤਾਵੇਜ਼ 'ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ' (FARMSKING TECHNOLOGIES PRIVATE LIMITED) ਦੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਲਈ ਪੂਰਾ ਕਾਨੂੰਨੀ ਖਰੜਾ ਹੈ। "
        "ਇਸ ਵਿੱਚ ਪ੍ਰੋਜੈਕਟ ਅਨੁਸਾਰ ਚਾਰ ਪ੍ਰਮੁੱਖ ਥੰਮ੍ਹ ਸ਼ਾਮਲ ਕੀਤੇ ਗਏ ਹਨ:\n"
        "1. ਡਿਜੀਟਲ ਖੇਤੀਬਾੜੀ ਅਤੇ ਐਗਰੀ-ਟੈੱਕ ਸਾਫਟਵੇਅਰ (Digital Farming & Precision Agriculture)\n"
        "2. ਕਿਸਾਨ ਸਿੱਖਿਆ, ਜਾਗਰੂਕਤਾ ਅਤੇ ਹੁਨਰ ਵਿਕਾਸ (Farmer Education & Skilling)\n"
        "3. ਲੋਕ ਭਲਾਈ, ਸਮਾਜ ਭਲਾਈ ਅਤੇ ਪੇਂਡੂ ਵਿਕਾਸ (Lok Bhalai & Rural Upliftment)\n"
        "4. ਖੇਤੀਬਾੜੀ ਅਤੇ ਬਾਗਬਾਨੀ ਈ-ਕਾਮਰਸ ਬਾਜ਼ਾਰ (Agri & Gardening E-Commerce Marketplace)\n\n"
        "ਇਸ ਫਾਈਲ ਵਿੱਚ ਪੂਰਾ MoA (ਮੁੱਖ ਅਤੇ ਸਹਾਇਕ ਉਦੇਸ਼), AoA (ਕੰਪਨੀ ਨਿਯਮ), NIC ਕੋਡ, DIR-2, INC-9 ਅਤੇ ਰਜਿਸਟਰਡ ਆਫਿਸ ਦਾ NOC ਫਾਰਮੈਟ ਪੂਰੀ ਤਰ੍ਹਾਂ ਤਿਆਰ ਹਨ।"
    )
    cp_run2.font.name = font_name
    cp_run2.font.size = Pt(10)
    cp_run2.font.color.rgb = dark_text

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------
    # SECTION 1: ਕੰਪਨੀ ਦੇ ਨਾਮ ਅਤੇ ਉਦਯੋਗਿਕ ਕੋਡ (NIC Codes)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. ਕੰਪਨੀ ਦੇ ਪ੍ਰਸਤਾਵਿਤ ਨਾਮ ਅਤੇ ਉਦਯੋਗਿਕ ਵਰਗੀਕਰਨ ਕੋਡ (NIC CODES)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run("ਪ੍ਰਸਤਾਵਿਤ ਕੰਪਨੀ ਦੇ ਨਾਮ (MCA RUN / SPICe+ Part A ਲਈ ਪਸੰਦ ਅਨੁਸਾਰ):").font.bold = True
    
    names = [
        "1. FARMSKING TECHNOLOGIES PRIVATE LIMITED (ਪਹਿਲੀ ਪਸੰਦ - First Preference)",
        "2. FARMSKING TECHNOLOGIES PRIVATE LIMITED (ਦੂਜੀ ਪਸੰਦ - Second Preference)",
        "3. FARMSKING AGRI SOLUTIONS PRIVATE LIMITED (ਤੀਜੀ ਪਸੰਦ)",
        "4. FARMSKING DIGITAL AGRO PRIVATE LIMITED (ਚੌਥੀ ਪਸੰਦ)"
    ]
    for nm in names:
        p_nm = doc.add_paragraph(nm, style='List Bullet')
        p_nm.paragraph_format.space_after = Pt(2)

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(6)
    p_sig.add_run("ਨਾਮ ਦਾ ਅਰਥ ਅਤੇ ਮਹੱਤਤਾ (Significance of Name): ").font.bold = True
    p_sig.add_run(
        "'FARMSKING' ਸ਼ਬਦ ਦੋ ਮਹੱਤਵਪੂਰਨ ਵਿਚਾਰਾਂ ਤੋਂ ਬਣਿਆ ਹੈ: 'FARMS' (ਜੋ ਖੇਤੀਬਾੜੀ, ਕੁਦਰਤੀ ਵਾਤਾਵਰਣ, ਕਿਸਾਨੀ ਖੁਸ਼ਹਾਲੀ ਅਤੇ ਬਾਗਬਾਨੀ ਨੂੰ ਦਰਸਾਉਂਦਾ ਹੈ) "
        "ਅਤੇ 'KING' (ਜੋ ਕਿਸਾਨ ਦੀ ਆਤਮ-ਨਿਰਭਰਤਾ, ਮੋਹਰੀ ਭੂਮਿਕਾ, ਵਧੀਆ ਕੁਆਲਿਟੀ ਅਤੇ ਬਾਦਸ਼ਾਹੀ ਖੁਸ਼ਹਾਲੀ ਦਾ ਪ੍ਰਤੀਕ ਹੈ)। "
        "ਇਹ ਕੰਪਨੀ ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਡਿਜੀਟਲ ਖੇਤੀ ਐਪ, ਕਿਸਾਨ ਸਿਖਲਾਈ ਅਕੈਡਮੀ, ਲੋਕ ਭਲਾਈ ਸੇਵਾਵਾਂ ਅਤੇ ਖਾਦ-ਬੀਜ ਦਾ ਆਨਲਾਈਨ ਬਾਜ਼ਾਰ ਚਲਾਉਣ ਲਈ ਬਣਾਈ ਜਾ ਰਹੀ ਹੈ।"
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # NIC Table
    nic_tbl = doc.add_table(rows=6, cols=3)
    nic_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    nic_headers = ["NIC 2008 ਕੋਡ", "ਸਰਕਾਰੀ ਗਤੀਵਿਧੀ ਵੇਰਵਾ (Activity Description)", "ਫਾਰਮਜ਼ਕਿੰਗ ਵਿੱਚ ਇਸਦਾ ਕੰਮ ਅਤੇ ਦਾਇਰਾ"]
    for i, h in enumerate(nic_headers):
        c = nic_tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 150, 150)
        p = c.paragraphs[0]
        run = p.add_run(h)
        run.font.name = font_name
        run.font.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(255, 255, 255)

    nic_data = [
        ("62013 / 62099", "ਸਾਫਟਵੇਅਰ ਸਪੋਰਟ, ਮੇਨਟੇਨੈਂਸ, ਵੈੱਬ ਪੋਰਟਲ ਅਤੇ ਮੋਬਾਈਲ ਐਪਲੀਕੇਸ਼ਨ ਤਿਆਰ ਕਰਨਾ", "ਮੁੱਖ ਕੰਮ: ਐਗਰੀ-ਟੈੱਕ SaaS ਸਾਫਟਵੇਅਰ, AI ਕਰੌਪ ਡਾਕਟਰ, ਸੈਟੇਲਾਈਟ ਫਸਲ ਨਿਗਰਾਨੀ, ਕਲਾਉਡ ਡਾਟਾ"),
        ("01611 / 01619", "ਖੇਤੀਬਾੜੀ ਲਈ ਸਹਾਇਤਾ ਗਤੀਵਿਧੀਆਂ, ਫਸਲ ਕੀੜੇ-ਮਕੌੜੇ ਪ੍ਰਬੰਧਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹਕਾਰੀ", "ਦੂਜਾ ਕੰਮ: ਟੈਲੀ-ਐਗਰੋਨੋਮੀ, ਜ਼ਮੀਨ ਅਤੇ ਫਸਲ ਦੀ ਸਿਹਤ ਦੀ ਜਾਂਚ, ਬਾਗਬਾਨੀ ਸਲਾਹਕਾਰ ਨੈੱਟਵਰਕ"),
        ("85499", "ਹੋਰ ਸਿੱਖਿਆ ਸੇਵਾਵਾਂ (ਤਕਨੀਕੀ ਸਿਖਲਾਈ, ਕਿਸਾਨ ਹੁਨਰ ਵਿਕਾਸ, ਡਿਜੀਟਲ ਸਾਖਰਤਾ)", "ਸਿੱਖਿਆ ਕੰਮ: ਕਿਸਾਨ ਟ੍ਰੇਨਿੰਗ ਕੈਂਪ, ਆਧੁਨਿਕ ਖੇਤੀ ਵਰਕਸ਼ਾਪਾਂ, ਪੇਂਡੂ ਨੌਜਵਾਨਾਂ ਨੂੰ ਤਕਨੀਕੀ ਸਿਖਲਾਈ"),
        ("88900", "ਬਿਨਾਂ ਰਿਹਾਇਸ਼ ਦੇ ਸਮਾਜ ਸੇਵਾ ਅਤੇ ਭਲਾਈ ਕਾਰਜ (ਪੇਂਡੂ ਕਿਸਾਨ ਭਲਾਈ, ਜੀਵਨ-ਪੱਧਰ ਸੁਧਾਰ)", "ਲੋਕ ਭਲਾਈ ਕੰਮ: ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ, ਆੜ੍ਹਤੀਆਂ ਦੀ ਲੁੱਟ ਤੋਂ ਬਚਾਅ, ਕਰਜ਼ਾ-ਮੁਕਤੀ ਜਾਗਰੂਕਤਾ, ਪਾਣੀ ਦੀ ਸੰਭਾਲ"),
        ("47912", "ਈ-ਕਾਮਰਸ ਅਤੇ ਆਨਲਾਈਨ ਬਾਜ਼ਾਰ ਰਾਹੀਂ ਰਿਟੇਲ ਵਿਕਰੀ (ਖੇਤੀਬਾੜੀ ਇਨਪੁਟਸ, ਬੀਜ, ਖਾਦਾਂ, ਸੰਦ)", "ਈ-ਕਾਮਰਸ ਕੰਮ: ਪ੍ਰਮਾਣਿਤ ਬੀਜਾਂ, ਜੈਵਿਕ ਖਾਦਾਂ, ਸਪਰੇਅ ਪੰਪਾਂ, ਪੌਦਿਆਂ ਦੀ ਹੋਮ ਡਿਲੀਵਰੀ")
    ]

    for row_idx, data in enumerate(nic_data, start=1):
        for col_idx, text in enumerate(data):
            c = nic_tbl.cell(row_idx, col_idx)
            if row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 120, 120)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = font_name
            run.font.size = Pt(9.5)
            run.font.color.rgb = dark_text
            if col_idx == 0:
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 2: MoA ਕਲੌਜ਼ III(A) — ਮੁੱਖ ਉਦੇਸ਼ (MAIN OBJECTS)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. ਮੈਮੋਰੈਂਡਮ ਆਫ ਐਸੋਸੀਏਸ਼ਨ (MoA) — ਕਲੌਜ਼ III(A): ਮੁੱਖ ਉਦੇਸ਼ (MAIN OBJECTS)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    p_intro = doc.add_paragraph()
    p_intro.add_run(
        "(ਇਹ 6 ਕਲੌਜ਼ ਪੂਰੀ ਕਾਨੂੰਨੀ ਭਾਸ਼ਾ ਵਿੱਚ ਹਨ, ਜਿਨ੍ਹਾਂ ਨੂੰ CA ਸਿੱਧਾ ਸਰਕਾਰੀ MCA V3 ਫਾਰਮ INC-33 e-MoA ਵਿੱਚ ਪੇਸਟ ਕਰੇਗਾ। ਹਰੇਕ ਕਲੌਜ਼ ਦੇ ਹੇਠਾਂ ਅੰਗਰੇਜ਼ੀ ਕਾਨੂੰਨੀ ਇਬਾਰਤ ਵੀ ਦਿੱਤੀ ਗਈ ਹੈ):"
    ).font.italic = True

    main_objects = [
        (
            "ਉਦੇਸ਼ 1: ਡਿਜੀਟਲ ਖੇਤੀਬਾੜੀ, ਸ਼ੁੱਧ ਖੇਤੀ (Precision Farming) ਅਤੇ ਐਗਰੀ-ਟੈੱਕ SaaS ਸਾਫਟਵੇਅਰ",
            "ਕੰਪਨੀ ਵੱਲੋਂ 'ਫਾਰਮਜ਼ਕਿੰਗ' (FarmsKing) ਬ੍ਰਾਂਡ ਜਾਂ ਕਿਸੇ ਹੋਰ ਨਾਮ ਹੇਠ ਅਤਿ-ਆਧੁਨਿਕ ਡਿਜੀਟਲ ਖੇਤੀਬਾੜੀ, ਬਾਗਬਾਨੀ ਅਤੇ ਸ਼ੁੱਧ ਖੇਤੀ (Precision Farming) ਪਲੇਟਫਾਰਮ, "
            "ਕਲਾਉਡ ਸਾਫਟਵੇਅਰ, ਵੈੱਬ ਪੋਰਟਲ ਅਤੇ ਮੋਬਾਈਲ ਐਪਲੀਕੇਸ਼ਨਾਂ ਤਿਆਰ ਕਰਨਾ, ਚਲਾਉਣਾ, ਮਾਲਕੀ ਰੱਖਣਾ ਅਤੇ ਲਾਇਸੰਸ ਦੇਣਾ; ਜਿਸ ਵਿੱਚ ਆਰਟੀਫਿਸ਼ੀਅਲ ਇੰਟੈਲੀਜੈਂਸ (AI), "
            "ਮਸ਼ੀਨ ਲਰਨਿੰਗ (ML), ਕੰਪਿਊਟਰ ਵਿਜ਼ਨ, ਇੰਟਰਨੈੱਟ ਆਫ ਥਿੰਗਜ਼ (IoT) ਸੈਂਸਰ, ਸੈਟੇਲਾਈਟ ਰਿਮੋਟ ਸੈਂਸਿੰਗ, NDVI ਫਸਲ ਨਿਗਰਾਨੀ, ਡਰੋਨ ਏਰੀਅਲ ਸਕਾਊਟਿੰਗ, "
            "ਆਟੋਮੈਟਿਕ ਸਮਾਰਟ ਸਿੰਚਾਈ ਸ਼ਡਿਊਲ, ਮੌਸਮ ਦੀ ਭਵਿੱਖਬਾਣੀ, ਖੇਤ ਦਾ ਡਿਜੀਟਲ ਵਹੀ-ਖਾਤਾ ਅਤੇ ਖੇਤੀਬਾੜੀ ਵਿਗਿਆਨ ਸ਼ਾਮਲ ਹੋਣਗੇ।",
            "Legal English for e-MoA: To design, develop, build, host, operate, own, maintain, license, and commercialize comprehensive digital agriculture, precision farming, and horticulture technology platforms, cloud software, and mobile applications under the brand name 'FarmsKing' equipped with AI, ML, IoT sensors, satellite NDVI telemetry, drone crop scouting, smart irrigation, weather intelligence, and farm ledger accounting across India and internationally."
        ),
        (
            "ਉਦੇਸ਼ 2: ਡਿਜੀਟਲ ਖੇਤੀ ਪ੍ਰਚਾਰ, ਕਿਸਾਨ ਸਿੱਖਿਆ ਅਤੇ ਹੁਨਰ ਵਿਕਾਸ (Education, Literacy & Skilling)",
            "ਆਧੁਨਿਕ ਡਿਜੀਟਲ ਖੇਤੀ, ਸ਼ੁੱਧ ਖੇਤੀਬਾੜੀ ਅਤੇ ਵਾਤਾਵਰਣ-ਅਨੁਕੂਲ ਖੇਤੀ ਤਕਨੀਕਾਂ ਦਾ ਪ੍ਰਚਾਰ ਅਤੇ ਪ੍ਰਸਾਰ ਕਰਨ ਲਈ ਡਿਜੀਟਲ ਕਿਸਾਨ ਸਿਖਲਾਈ ਕੇਂਦਰ, ਖੇਤੀਬਾੜੀ ਸਾਖਰਤਾ ਕੈਂਪ, "
            "ਪੇਂਡੂ ਨੌਜਵਾਨ ਹੁਨਰ ਵਿਕਾਸ ਬੂਟਕੈਂਪ, ਵਰਕਸ਼ਾਪਾਂ, ਸੈਮੀਨਾਰ, ਵੈਬੀਨਾਰ, ਸਰਟੀਫਿਕੇਸ਼ਨ ਕੋਰਸ, ਆਡੀਓ-ਵੀਡੀਓ ਵਿਦਿਅਕ ਸਮੱਗਰੀ, ਬਹੁ-ਭਾਸ਼ਾਈ ਖੇਤੀਬਾੜੀ ਅਕੈਡਮੀਆਂ, ਮੋਬਾਈਲ ਪ੍ਰਦਰਸ਼ਨੀ ਵੈਨਾਂ "
            "ਅਤੇ ਈ-ਲਰਨਿੰਗ ਪਲੇਟਫਾਰਮ ਸਥਾਪਿਤ ਕਰਨਾ ਅਤੇ ਚਲਾਉਣਾ; ਕਿਸਾਨਾਂ, ਪੇਂਡੂ ਨੌਜਵਾਨਾਂ ਅਤੇ ਮਹਿਲਾ ਕਿਸਾਨਾਂ ਨੂੰ ਸਮਾਰਟਫੋਨ ਰਾਹੀਂ ਖੇਤ ਪ੍ਰਬੰਧਨ, ਡਿਜੀਟਲ ਰਿਕਾਰਡ ਰੱਖਣ, "
            "ਜ਼ਮੀਨ ਦੀ ਉਪਜਾਊ ਸ਼ਕਤੀ ਦੀ ਸੰਭਾਲ, ਜੈਵਿਕ ਖੇਤੀ, ਤੁਪਕਾ ਸਿੰਚਾਈ ਅਤੇ ਫਸਲ ਦੀ ਸਾਂਭ-ਸੰਭਾਲ ਦੀ ਸਿਖਲਾਈ ਦੇ ਕੇ ਪੇਂਡੂ ਡਿਜੀਟਲ ਪਾੜੇ ਨੂੰ ਖਤਮ ਕਰਨਾ ਅਤੇ ਖੇਤੀ ਉਤਪਾਦਕਤਾ ਵਧਾਉਣਾ।",
            "Legal English for e-MoA: To actively promote and advance digital farming, precision agriculture, and sustainable practices by establishing and managing digital farmer training centers, agricultural literacy camps, rural skill development bootcamps, workshops, webinars, certification programs, audio-visual content, multi-lingual academies, and e-learning platforms; training farmers and rural youth in digital farm management, soil fertility, climate-smart agriculture, and micro-irrigation."
        ),
        (
            "ਉਦੇਸ਼ 3: ਲੋਕ ਭਲਾਈ, ਸਮਾਜ ਭਲਾਈ ਅਤੇ ਪੇਂਡੂ ਵਿਕਾਸ (Social Welfare, Farmer Upliftment & Lok Bhalai)",
            "ਛੋਟੇ, ਸੀਮਾਂਤ ਅਤੇ ਗਰੀਬ ਕਿਸਾਨਾਂ ਅਤੇ ਪੇਂਡੂ ਭਾਈਚਾਰੇ ਦੀ ਆਰਥਿਕ ਸਥਿਰਤਾ, ਸਮਾਜਿਕ ਸੁਰੱਖਿਆ ਅਤੇ ਸਰਬਪੱਖੀ ਭਲਾਈ ਲਈ 'ਲੋਕ ਭਲਾਈ' ਪ੍ਰੋਗਰਾਮ ਉਲੀਕਣਾ, ਚਲਾਉਣਾ ਅਤੇ ਸਮਰਥਨ ਦੇਣਾ; "
            "ਕਿਸਾਨ ਸੰਕਟਕਾਲੀਨ ਹੈਲਪਲਾਈਨ, ਖ਼ੁਦਕੁਸ਼ੀ ਰੋਕੂ ਸਲਾਹਕਾਰ ਡੈਸਕ, ਸਹੀ ਭਾਅ ਜਾਗਰੂਕਤਾ ਮੁਹਿੰਮਾਂ, ਕਰਜ਼ਾ-ਮੁਕਤੀ ਵਿੱਤੀ ਸਾਖਰਤਾ, ਮਿੱਟੀ ਅਤੇ ਧਰਤੀ ਹੇਠਲੇ ਪਾਣੀ ਦੀ ਸੰਭਾਲ ਮੁਹਿੰਮਾਂ, "
            "ਕੁਦਰਤੀ ਖੇਤੀ ਮੁਹਿੰਮਾਂ ਚਲਾਉਣਾ; ਕਿਸਾਨ ਉਤਪਾਦਕ ਜਥੇਬੰਦੀਆਂ (FPOs) ਅਤੇ ਸਵੈ-ਸਹਾਇਤਾ ਸਮੂਹਾਂ (SHGs) ਨੂੰ ਤਕਨੀਕੀ ਸ਼ਕਤੀ ਪ੍ਰਦਾਨ ਕਰਨਾ; ਵਿਚੋਲਿਆਂ ਅਤੇ ਆੜ੍ਹਤੀਆਂ ਦੁਆਰਾ "
            "ਕੀਤੀ ਜਾਂਦੀ ਆਰਥਿਕ ਲੁੱਟ ਅਤੇ ਨਾਜਾਇਜ਼ ਵਿਆਜ ਤੋਂ ਬਚਾਅ ਲਈ ਪਾਰਦਰਸ਼ੀ ਬਾਜ਼ਾਰ ਨਿਯਮ ਸਥਾਪਿਤ ਕਰਨਾ; ਅਤੇ ਕਾਰਪੋਰੇਟ ਸਮਾਜਿਕ ਜ਼ਿੰਮੇਵਾਰੀ (CSR) ਤਹਿਤ ਪੇਂਡੂ ਵਿਕਾਸ ਕਾਰਜ ਕਰਨਾ।",
            "Legal English for e-MoA: To conceptualize, organize, implement, support, and administer public welfare, social upliftment, and community benefit programs ('Lok Bhalai') aimed at the holistic welfare, economic stability, and social security of small and marginal farmers; to set up farmer distress helplines, fair-price awareness campaigns, debt-management financial education, soil and water conservation drives, FPO capacity building, anti-exploitation transparent market practices, and CSR rural welfare projects."
        ),
        (
            "ਉਦੇਸ਼ 4: ਖੇਤੀਬਾੜੀ ਅਤੇ ਬਾਗਬਾਨੀ ਈ-ਕਾਮਰਸ ਬਾਜ਼ਾਰ (Agri & Horticulture E-Commerce Marketplace)",
            "ਖੇਤੀਬਾੜੀ ਇਨਪੁਟਸ, ਪ੍ਰਮਾਣਿਤ ਹਾਈਬ੍ਰਿਡ ਅਤੇ ਦੇਸੀ ਬੀਜਾਂ, ਜੈਵਿਕ ਖਾਦਾਂ, ਬਾਇਓ-ਨਿਊਟ੍ਰੀਐਂਟਸ, ਬਾਇਓ-ਪੈਸਟੀਸਾਈਡਜ਼, ਮਾਈਕ੍ਰੋ-ਨਿਊਟ੍ਰੀਐਂਟਸ, ਤੁਪਕਾ ਅਤੇ ਫੁਹਾਰਾ ਸਿੰਚਾਈ ਸੰਦਾਂ, "
            "ਖੇਤੀ ਮਸ਼ੀਨਰੀ, ਕਟਾਈ-ਛੰਗਾਈ ਸੰਦਾਂ, ਨਰਸਰੀ ਪੌਦਿਆਂ, ਘਰੇਲੂ ਗਮਲਿਆਂ ਦੇ ਪੌਦਿਆਂ, ਛੱਤ ਦੇ ਬਗੀਚੇ (ਟੈਰੇਸ ਗਾਰਡਨ) ਦੇ ਸਮਾਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਉਤਪਾਦਾਂ ਦੀ ਖਰੀਦ, ਵੇਚ, ਆਯਾਤ, ਨਿਰਯਾਤ, "
            "ਸਟੋਰੇਜ ਅਤੇ ਹੋਮ ਡਿਲੀਵਰੀ ਲਈ ਇੱਕ ਆਲ-ਇੰਡੀਆ ਈ-ਕਾਮਰਸ ਬਾਜ਼ਾਰ (D2C, B2B, B2C) ਚਲਾਉਣਾ; ਅਤੇ ਕਿਸਾਨਾਂ ਨੂੰ ਖੇਤ ਤੋਂ ਸਿੱਧਾ ਗਾਹਕ ਤੱਕ ਵੇਚਣ ਦੀ ਸੁਵਿਧਾ ਦੇ ਕੇ ਵਾਜਬ ਭਾਅ ਦਿਵਾਉਣਾ।",
            "Legal English for e-MoA: To establish, operate, manage, and facilitate an omnichannel electronic marketplace, e-commerce platform, D2C, B2B, and B2C digital supply chain network for buying, selling, distributing, warehousing, and delivering agricultural inputs, certified seeds, organic fertilizers, sprayers, farm tools, nursery plants, gardening accessories, and enabling direct farm-to-fork remunerative market linkages for farmers."
        ),
        (
            "ਉਦੇਸ਼ 5: ਟੈਲੀ-ਸਲਾਹਕਾਰ, ਕਰੌਪ ਡਾਕਟਰ ਅਤੇ ਬਾਗਬਾਨੀ ਮਾਹਿਰ ਨੈੱਟਵਰਕ (Crop Doctor & Expert Consultations)",
            "ਕਿਸਾਨਾਂ, ਘਰੇਲੂ ਬਗੀਚਾ ਮਾਲਕਾਂ ਅਤੇ ਬਾਗਵਾਨਾਂ ਨੂੰ ਪ੍ਰਮਾਣਿਤ ਖੇਤੀਬਾੜੀ ਵਿਗਿਆਨੀਆਂ, ਫਸਲ ਡਾਕਟਰਾਂ, ਬਾਗਬਾਨੀ ਮਾਹਿਰਾਂ ਅਤੇ ਪੌਦਿਆਂ ਦੇ ਰੋਗ ਵਿਗਿਆਨੀਆਂ ਨਾਲ ਆਨਲਾਈਨ ਜੋੜਨ ਲਈ "
            "ਟੈਲੀ-ਕੰਸਲਟੇਸ਼ਨ ਪਲੇਟਫਾਰਮ ਅਤੇ ਡਿਜੀਟਲ ਕਲੀਨਿਕ ਚਲਾਉਣਾ; ਫਸਲਾਂ ਅਤੇ ਪੌਦਿਆਂ ਦੀਆਂ ਬਿਮਾਰੀਆਂ, ਕੀੜਿਆਂ ਅਤੇ ਪੌਸ਼ਟਿਕ ਤੱਤਾਂ ਦੀ ਘਾਟ ਦੀ ਫੋਟੋ ਅਤੇ AI ਰਾਹੀਂ ਤੁਰੰਤ ਜਾਂਚ ਕਰਕੇ "
            "ਪੰਜਾਬੀ, ਹਿੰਦੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਭਾਸ਼ਾ ਵਿੱਚ ਵੌਇਸ ਅਤੇ ਚੈਟ ਰਾਹੀਂ ਸਹੀ ਜੈਵਿਕ ਅਤੇ ਵਿਗਿਆਨਕ ਇਲਾਜ ਮੁਹੱਈਆ ਕਰਵਾਉਣਾ।",
            "Legal English for e-MoA: To establish and operate interactive digital consultation platforms, tele-agronomy clinics, and digital diagnostic centers connecting farmers and gardeners with certified agronomists, crop doctors, and horticulturists; providing automated AI plant disease diagnosis and prescribing scientifically verified remedies via Punjabi, Hindi, and English voice/chat interfaces."
        ),
        (
            "ਉਦੇਸ਼ 6: ਰੋਜ਼ਾਨਾ ਮੰਡੀ ਭਾਅ ਪਾਰਦਰਸ਼ਤਾ, ਖੇਤ ਵਹੀ-ਖਾਤਾ ਅਤੇ ਵਿੱਤੀ ਪ੍ਰਬੰਧਨ (Mandi Intelligence & Accounting)",
            "ਸਾਰੇ ਭਾਰਤ ਦੀਆਂ ਸਰਕਾਰੀ ਅਨਾਜ ਮੰਡੀਆਂ, APMC ਅਤੇ ਪ੍ਰਾਈਵੇਟ ਬਾਜ਼ਾਰਾਂ ਤੋਂ ਰੋਜ਼ਾਨਾ ਫਸਲਾਂ ਦੇ ਭਾਅ, ਸਰਕਾਰੀ ਸਮਰਥਨ ਮੁੱਲ (MSP) ਅਤੇ ਮੰਡੀ ਆਮਦ ਦੇ ਡਾਟਾ ਨੂੰ ਇਕੱਠਾ ਕਰਕੇ "
            "ਕਿਸਾਨਾਂ ਤੱਕ ਰੀਅਲ-ਟਾਈਮ ਪਹੁੰਚਾਉਣਾ; ਕਿਸਾਨਾਂ ਲਈ ਆਟੋਮੈਟਿਕ ਖੇਤ ਖਰਚਾ ਕੈਲਕੁਲੇਟਰ, ਆੜ੍ਹਤੀਆਂ ਦਾ ਵਿਆਜ ਅਤੇ ਕਮਿਸ਼ਨ ਹਿਸਾਬ ਕਰਨ ਵਾਲੇ ਟੂਲ, ਡਿਜੀਟਲ ਰਸੀਦਾਂ, ਅਤੇ ਲਾਭ-ਹਾਨੀ ਟਰੈਕਿੰਗ "
            "ਸੁਵਿਧਾ ਦੇਣਾ ਤਾਂ ਜੋ ਕਿਸਾਨ ਪਰਿਵਾਰ ਆਪਣੇ ਖੇਤ ਦਾ ਪਾਰਦਰਸ਼ੀ ਅਤੇ ਮੁਨਾਫ਼ੇ ਵਾਲਾ ਹਿਸਾਬ-ਕਿਤਾਬ ਰੱਖ ਸਕਣ।",
            "Legal English for e-MoA: To aggregate and disseminate real-time daily mandi rates, commodity arrivals, MSP data, and market analytics across India; providing automated crop economics calculators, commission and interest computation engines for commission agents (arhtiyas), digital receipts, and farm accounting tools for farming families."
        )
    ]

    for title, desc_pb, desc_en in main_objects:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(8)
        p_t.paragraph_format.space_after = Pt(2)
        r_t = p_t.add_run(f"📌 {title}")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(11)
        r_t.font.color.rgb = dark_text

        p_c = doc.add_paragraph()
        p_c.paragraph_format.left_indent = Inches(0.2)
        p_c.paragraph_format.right_indent = Inches(0.2)
        p_c.paragraph_format.space_after = Pt(3)
        r_c = p_c.add_run(desc_pb)
        r_c.font.name = font_name
        r_c.font.size = Pt(9.5)
        r_c.font.color.rgb = RGBColor(30, 41, 59)

        p_en = doc.add_paragraph()
        p_en.paragraph_format.left_indent = Inches(0.2)
        p_en.paragraph_format.right_indent = Inches(0.2)
        p_en.paragraph_format.space_after = Pt(6)
        r_en = p_en.add_run(f"[{desc_en}]")
        r_en.font.name = "Calibri"
        r_en.font.italic = True
        r_en.font.size = Pt(8.5)
        r_en.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 3: MoA ਕਲੌਜ਼ III(B) — ਸਹਾਇਕ ਉਦੇਸ਼ (INCIDENTAL OBJECTS)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. MoA ਕਲੌਜ਼ III(B): ਸਹਾਇਕ ਅਤੇ ਕਾਨੂੰਨੀ ਉਦੇਸ਼ (INCIDENTAL POWERS - 17 ਕਲੌਜ਼)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    p_b_intro = doc.add_paragraph()
    p_b_intro.add_run("ਇਹ ਕਲੌਜ਼ ਕੰਪਨੀ ਨੂੰ ਬੈਂਕ ਖਾਤੇ, ਸਰਕਾਰੀ ਸਕੀਮਾਂ, ਇਕਰਾਰਨਾਮੇ, ਜ਼ਮੀਨ ਜਾਇਦਾਦ, ਅਤੇ ਸਮਾਜ ਸੇਵਾ ਦੇ ਪੂਰੇ ਕਾਨੂੰਨੀ ਅਧਿਕਾਰ ਦਿੰਦੇ ਹਨ:").font.italic = True

    inc_objects_pb = [
        ("1. ਖੋਜ ਅਤੇ ਬੌਧਿਕ ਸੰਪੱਤੀ (Research & IP):", "ਖੇਤੀਬਾੜੀ ਅਤੇ ਸਾਫਟਵੇਅਰ ਸਬੰਧੀ ਖੋਜ ਕਰਨਾ, ਪੇਟੈਂਟ, ਟ੍ਰੇਡਮਾਰਕ, ਕਾਪੀਰਾਈਟ ਅਤੇ AI ਐਲਗੋਰਿਦਮ ਰਜਿਸਟਰ ਕਰਵਾਉਣਾ ਅਤੇ ਆਪਣੇ ਹੱਕਾਂ ਦੀ ਰਾਖੀ ਕਰਨਾ।"),
        ("2. ਵਿੱਦਿਅਕ ਅਤੇ ਸਰਕਾਰੀ ਭਾਈਵਾਲੀ:", "ਪੰਜਾਬ ਐਗਰੀਕਲਚਰਲ ਯੂਨੀਵਰਸਿਟੀ (PAU ਲੁਧਿਆਣਾ), ICAR, ਖੇਤੀਬਾੜੀ ਵਿਗਿਆਨ ਕੇਂਦਰਾਂ (KVKs), ਕੇਂਦਰੀ ਖੇਤੀਬਾੜੀ ਮੰਤਰਾਲੇ ਅਤੇ ਨਾਬਾਰਡ (NABARD) ਨਾਲ ਮਿਲ ਕੇ ਕਿਸਾਨ ਭਲਾਈ ਅਤੇ ਸਿਖਲਾਈ ਪ੍ਰੋਜੈਕਟ ਚਲਾਉਣਾ।"),
        ("3. ਕਲਾਉਡ ਸਰਵਰ ਅਤੇ ਡਿਜੀਟਲ ਇਨਫਰਾਸਟ੍ਰਕਚਰ:", "ਡਿਜੀਟਲ ਪਲੇਟਫਾਰਮ ਚਲਾਉਣ ਲਈ ਕਲਾਉਡ ਸਰਵਰ, ਸਾਈਬਰ ਸੁਰੱਖਿਆ, ਸੈਟੇਲਾਈਟ ਡਾਟਾ APIs, WhatsApp/SMS ਗੇਟਵੇਅ ਅਤੇ ਪੇਮੈਂਟ ਗੇਟਵੇਅ ਖਰੀਦਣਾ ਅਤੇ ਚਲਾਉਣਾ।"),
        ("4. ਪੇਂਡੂ ਸੁਵਿਧਾ ਕੇਂਦਰ ਅਤੇ ਐਗਰੀ-ਕਲੀਨਿਕ:", "ਪਿੰਡਾਂ ਵਿੱਚ ਡਿਜੀਟਲ ਕਿਸਾਨ ਕਿਓਸਕ, ਮਿੱਟੀ ਪਰਖ ਲੈਬਾਰਟਰੀਆਂ, ਪੌਦਾ ਹਸਪਤਾਲ, ਸਟੋਰੇਜ ਅਤੇ ਵੇਅਰਹਾਊਸ ਸਥਾਪਿਤ ਕਰਨਾ।"),
        ("5. ਬੈਂਕਿੰਗ ਅਤੇ ਵਿੱਤੀ ਲੈਣ-ਦੇਣ:", "ਕੰਪਨੀ ਦੇ ਨਾਮ 'ਤੇ ਕਰੰਟ ਅਕਾਊਂਟ (Current Account), ਓਵਰਡਰਾਫਟ (OD) ਖਾਤੇ ਖੋਲ੍ਹਣਾ, ਚੈੱਕ ਅਤੇ ਹੁੰਡੀਆਂ ਜਾਰੀ ਕਰਨਾ ਅਤੇ ਵਿੱਤੀ ਕੰਮ ਕਰਨਾ।"),
        ("6. ਕਰਜ਼ੇ ਅਤੇ ਨਿਵੇਸ਼ ਪ੍ਰਾਪਤ ਕਰਨਾ:", "ਕੰਪਨੀ ਦੇ ਵਿਕਾਸ ਲਈ ਬੈਂਕਾਂ, ਸਰਕਾਰੀ ਸੰਸਥਾਵਾਂ ਜਾਂ ਨਿਵੇਸ਼ਕਾਂ ਤੋਂ ਪ੍ਰੋਜੈਕਟ ਲੋਨ, ਵਰਕਿੰਗ ਕੈਪੀਟਲ ਅਤੇ ਸੀਡ ਫੰਡ ਪ੍ਰਾਪਤ ਕਰਨਾ।"),
        ("7. ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਅਤੇ ਸਬਸਿਡੀਆਂ ਦੀ ਸੁਵਿਧਾ:", "ਕਿਸਾਨਾਂ ਨੂੰ PM-ਕਿਸਾਨ, ਤੁਪਕਾ ਸਿੰਚਾਈ ਸਬਸਿਡੀ, ਖੇਤੀ ਮਸ਼ੀਨਰੀ ਸਬਸਿਡੀ (SMAM), ਐਗਰੀ ਇਨਫਰਾ ਫੰਡ (AIF) ਅਤੇ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ ਦਾ ਲਾਭ ਦਿਵਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਨਾ।"),
        ("8. ਕਾਰਪੋਰੇਟ ਸਮਾਜਿਕ ਜ਼ਿੰਮੇਵਾਰੀ (CSR) ਅਤੇ ਦਾਨ-ਪੁੰਨ:", "ਕੰਪਨੀ ਐਕਟ ਸੈਕਸ਼ਨ 135 ਅਨੁਸਾਰ ਕਿਸਾਨ ਰਾਹਤ ਫੰਡ, ਵਾਤਾਵਰਣ ਸੰਭਾਲ ਫੰਡ, ਪੇਂਡੂ ਸਕੂਲੀ ਵਜ਼ੀਫ਼ੇ ਅਤੇ ਗਰੀਬ ਕਿਸਾਨ ਭਲਾਈ ਟਰੱਸਟ ਸਥਾਪਿਤ ਕਰਨਾ।"),
        ("9. ਲੌਜਿਸਟਿਕਸ ਅਤੇ ਹੋਮ ਡਿਲੀਵਰੀ ਵਾਹਨ:", "ਖਾਦ, ਬੀਜ ਅਤੇ ਸੰਦਾਂ ਦੀ ਕਿਸਾਨਾਂ ਦੇ ਘਰ ਤੱਕ ਡਿਲੀਵਰੀ ਲਈ ਗੱਡੀਆਂ, ਇਲੈਕਟ੍ਰਿਕ ਵੈਨਾਂ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਪਰੇਅ ਡਰੋਨ ਖਰੀਦਣਾ ਜਾਂ ਕਿਰਾਏ 'ਤੇ ਲੈਣਾ।"),
        ("10. ਏਜੰਸੀ, ਡਿਸਟ੍ਰੀਬਿਊਟਰਸ਼ਿਪ ਅਤੇ ਫਰੈਂਚਾਇਜ਼ੀ:", "ਬੀਜ, ਖਾਦ, ਖੇਤੀ ਸੰਦਾਂ ਦੀਆਂ ਵੱਡੀਆਂ ਕੰਪਨੀਆਂ ਦੀ ਅਧਿਕਾਰਤ ਏਜੰਸੀ ਜਾਂ ਡਿਸਟ੍ਰੀਬਿਊਟਰਸ਼ਿਪ ਲੈਣਾ ਅਤੇ ਅੱਗੇ ਫਰੈਂਚਾਇਜ਼ੀ ਨੈੱਟਵਰਕ ਬਣਾਉਣਾ।"),
        ("11. ਮਾਹਿਰਾਂ ਅਤੇ ਤਕਨੀਕੀ ਅਮਲੇ ਦੀ ਨਿਯੁਕਤੀ:", "ਖੇਤੀਬਾੜੀ ਵਿਗਿਆਨੀਆਂ, ਸਾਫਟਵੇਅਰ ਇੰਜੀਨੀਅਰਾਂ, ਮਿੱਟੀ ਮਾਹਿਰਾਂ ਅਤੇ ਫੀਲਡ ਟ੍ਰੇਨਰਾਂ ਨੂੰ ਤਨਖਾਹ 'ਤੇ ਰੱਖਣਾ ਅਤੇ ਕੰਮ ਕਰਵਾਉਣਾ।"),
        ("12. ਕੰਪਨੀਆਂ ਦਾ ਰਲੇਵਾਂ (Mergers & Acquisitions):", "ਖੇਤੀ ਅਤੇ ਤਕਨਾਲੋਜੀ ਦੇ ਖੇਤਰ ਵਿੱਚ ਸਮਾਨ ਕੰਮ ਕਰਨ ਵਾਲੀਆਂ ਹੋਰ ਫਰਮਾਂ, ਸੁਸਾਇਟੀਆਂ ਜਾਂ ਕੰਪਨੀਆਂ ਨੂੰ ਖਰੀਦਣਾ ਜਾਂ ਸਾਂਝੇਦਾਰੀ (Joint Venture) ਕਰਨਾ।"),
        ("13. ਆਯਾਤ ਅਤੇ ਨਿਰਯਾਤ (Import & Export):", "ਵਿਦੇਸ਼ਾਂ ਤੋਂ ਆਧੁਨਿਕ ਖੇਤੀ ਸੈਂਸਰ, ਵਿਸ਼ੇਸ਼ ਬੀਜ, ਮਸ਼ੀਨਾਂ ਮੰਗਵਾਉਣਾ ਅਤੇ ਭਾਰਤੀ ਖੇਤੀ ਉਤਪਾਦ ਬਾਹਰਲੇ ਦੇਸ਼ਾਂ ਵਿੱਚ ਭੇਜਣਾ।"),
        ("14. ਰਸਾਲੇ, ਕਿਤਾਬਾਂ ਅਤੇ ਵਿੱਦਿਅਕ ਮੀਡੀਆ:", "ਕਿਸਾਨ ਜਾਗਰੂਕਤਾ ਲਈ ਖੇਤੀ ਰਸਾਲੇ, ਵਿੱਦਿਅਕ ਕਿਤਾਬਚੇ, ਪੋਡਕਾਸਟ, ਖੇਤੀ ਵੀਡੀਓਜ਼ ਅਤੇ ਡਿਜੀਟਲ ਅਖਬਾਰ ਤਿਆਰ ਕਰਨਾ ਅਤੇ ਵੰਡਣਾ।"),
        ("15. ਇਨਾਮ ਅਤੇ ਕੂਪਨ ਪ੍ਰਣਾਲੀ:", "ਕਿਸਾਨਾਂ ਅਤੇ ਖੇਤੀ ਸਲਾਹਕਾਰਾਂ ਨੂੰ ਡਿਜੀਟਲ ਖੇਤੀ ਨਾਲ ਜੋੜਨ ਲਈ ਲਾਇਲਟੀ ਪੁਆਇੰਟ, ਕੈਸ਼ਬੈਕ ਕੂਪਨ ਅਤੇ ਇਨਾਮੀ ਸਕੀਮਾਂ ਚਲਾਉਣਾ।"),
        ("16. ਕੁਦਰਤੀ ਆਫ਼ਤਾਂ ਵੇਲੇ ਰਾਹਤ ਕਾਰਜ:", "ਹੜ੍ਹਾਂ, ਸੋਕੇ, ਗੜੇਮਾਰੀ ਜਾਂ ਫਸਲੀ ਬਿਮਾਰੀਆਂ ਵੇਲੇ ਕਿਸਾਨਾਂ ਨੂੰ ਐਮਰਜੈਂਸੀ ਸਲਾਹ, ਮੁਫ਼ਤ ਬੀਜ ਅਤੇ ਰਾਹਤ ਸਮੱਗਰੀ ਮੁਹੱਈਆ ਕਰਵਾਉਣਾ।"),
        ("17. ਆਮ ਕਾਨੂੰਨੀ ਅਧਿਕਾਰ:", "ਕੰਪਨੀ ਦੇ ਮੁੱਖ ਟੀਚਿਆਂ ਨੂੰ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਕੰਪਨੀ ਕਾਨੂੰਨ 2013 ਅਧੀਨ ਆਉਂਦੇ ਸਾਰੇ ਜਾਇਜ਼ ਅਤੇ ਕਾਨੂੰਨੀ ਕੰਮ ਕਰਨ ਦਾ ਪੂਰਾ ਹੱਕ ਹੋਣਾ।")
    ]

    for title, desc in inc_objects_pb:
        p_inc = doc.add_paragraph()
        p_inc.paragraph_format.space_before = Pt(3)
        p_inc.paragraph_format.space_after = Pt(3)
        p_inc.paragraph_format.left_indent = Inches(0.2)
        r_t = p_inc.add_run(f"🔹 {title} ")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_inc.add_run(desc)
        r_d.font.name = font_name
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 4: ਆਰਟੀਕਲਜ਼ ਆਫ ਐਸੋਸੀਏਸ਼ਨ (AoA) — ਮੁੱਖ ਨਿਯਮ
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. ਆਰਟੀਕਲਜ਼ ਆਫ ਐਸੋਸੀਏਸ਼ਨ (AoA) — ਕੰਪਨੀ ਦੇ ਅੰਦਰੂਨੀ ਨਿਯਮ (FORM INC-34)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    aoa_points_pb = [
        ("4.1 ਟੇਬਲ F (Table F) ਨੂੰ ਅਪਣਾਉਣਾ:", "ਕੰਪਨੀ, ਕੰਪਨੀ ਕਾਨੂੰਨ 2013 ਦੇ ਸ਼ਡਿਊਲ I ਦੇ ਟੇਬਲ F ਦੇ ਸਾਰੇ ਆਮ ਨਿਯਮਾਂ ਨੂੰ ਅਪਣਾਉਂਦੀ ਹੈ, ਸਿਵਾਏ ਹੇਠ ਲਿਖੇ ਵਿਸ਼ੇਸ਼ ਨਿਯਮਾਂ ਦੇ।"),
        ("4.2 ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ ਕੰਪਨੀ ਦੀਆਂ ਬੰਦਸ਼ਾਂ (ਧਾਰਾ 2(68)):", "ਸ਼ੇਅਰ ਕਿਸੇ ਬਾਹਰੀ ਵਿਅਕਤੀ ਨੂੰ ਵੇਚਣ 'ਤੇ ਪੂਰੀ ਪਾਬੰਦੀ ਹੈ; ਕੁੱਲ ਮੈਂਬਰਾਂ ਦੀ ਗਿਣਤੀ 200 ਤੱਕ ਸੀਮਤ ਹੈ; ਅਤੇ ਆਮ ਜਨਤਾ ਤੋਂ ਸ਼ੇਅਰਾਂ ਲਈ ਪੈਸਾ ਮੰਗਣ ਦੀ ਮਨਾਹੀ ਹੈ।"),
        ("4.3 ਸ਼ੇਅਰ ਟਰਾਂਸਫਰ ਦੀ ਪਹਿਲੀ ਪੇਸ਼ਕਸ਼ (Right of First Refusal - ROFR):", "ਕੋਈ ਵੀ ਘੱਟ-ਗਿਣਤੀ ਸ਼ੇਅਰਧਾਰਕ ਆਪਣੇ ਸ਼ੇਅਰ ਕਿਸੇ ਬਾਹਰਲੇ ਵਿਅਕਤੀ ਨੂੰ ਉਦੋਂ ਤੱਕ ਨਹੀਂ ਵੇਚ ਸਕਦਾ ਜਦੋਂ ਤੱਕ ਉਹ ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਮੁੱਖ ਸੰਸਥਾਪਕ (ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ) ਨੂੰ ਨਿਰਧਾਰਤ ਮੁੱਲ 'ਤੇ ਨਾ ਪੇਸ਼ ਕਰੇ। ਮੁੱਖ ਸੰਸਥਾਪਕ ਕੋਲ 30 ਦਿਨਾਂ ਦਾ ਪਹਿਲਾ ਅਧਿਕਾਰ ਰਹੇਗਾ।"),
        ("4.4 ਬੋਰਡ ਆਫ ਡਾਇਰੈਕਟਰਜ਼ ਅਤੇ ਵੀਟੋ ਪਾਵਰ (100% Supreme Control):", "ਘੱਟੋ-ਘੱਟ 2 ਅਤੇ ਵੱਧ ਤੋਂ ਵੱਧ 15 ਡਾਇਰੈਕਟਰ ਹੋ ਸਕਦੇ ਹਨ। ਮੁੱਖ ਸੰਸਥਾਪਕ ਕੋਲ 80% ਸ਼ੇਅਰਹੋਲਡਿੰਗ ਹੋਣ ਕਾਰਨ ਕਿਸੇ ਵੀ ਡਾਇਰੈਕਟਰ ਨੂੰ ਹਟਾਉਣ, ਨਵਾਂ ਰੱਖਣ, ਨਿਯਮ ਬਦਲਣ ਜਾਂ ਜਾਇਦਾਦ ਦਾ ਫੈਸਲਾ ਕਰਨ ਦਾ ਪੂਰਾ ਸੁਤੰਤਰ ਅਧਿਕਾਰ (Absolute Veto Control) ਹੋਵੇਗਾ।"),
        ("4.5 ਡਿਜੀਟਲ ਬੋਰਡ ਮੀਟਿੰਗਾਂ:", "ਮੀਟਿੰਗਾਂ ਆਹਮੋ-ਸਾਹਮਣੇ ਜਾਂ ਵੀਡੀਓ ਕਾਨਫਰੰਸਿੰਗ (Google Meet / Zoom) ਰਾਹੀਂ ਕਾਨੂੰਨ ਦੀ ਧਾਰਾ 173(2) ਅਨੁਸਾਰ ਕੀਤੀਆਂ ਜਾ ਸਕਦੀਆਂ ਹਨ, ਅਤੇ ਰਿਕਾਰਡ ਡਿਜੀਟਲ ਰੱਖਿਆ ਜਾਵੇਗਾ।")
    ]

    for title, desc in aoa_points_pb:
        p_aoa = doc.add_paragraph()
        p_aoa.paragraph_format.space_before = Pt(4)
        p_aoa.paragraph_format.space_after = Pt(4)
        p_aoa.paragraph_format.left_indent = Inches(0.2)
        r_t = p_aoa.add_run(f"⚖️ {title} ")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_aoa.add_run(desc)
        r_d.font.name = font_name
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 5: ਸ਼ੇਅਰ ਪੂੰਜੀ ਅਤੇ ਮੈਂਬਰਾਂ ਦਾ ਵੇਰਵਾ
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. ਕੰਪਨੀ ਦੀ ਸ਼ੇਅਰ ਪੂੰਜੀ ਅਤੇ ਪ੍ਰਸਤਾਵਿਤ ਸ਼ੇਅਰਹੋਲਡਰ ਸੂਚੀ")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    cap_tbl = doc.add_table(rows=5, cols=5)
    cap_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cap_headers = ["ਮੈਂਬਰ ਦਾ ਨਾਮ", "ਕੰਪਨੀ ਵਿੱਚ ਅਹੁਦਾ / ਰੋਲ", "ਪ੍ਰਸਤਾਵਿਤ ਸ਼ੇਅਰ", "ਸ਼ੇਅਰ ਫ਼ੀਸਦੀ", "ਕਾਨੂੰਨੀ / ਕਾਰਜਕਾਰੀ ਸਥਿਤੀ"]
    for i, h in enumerate(cap_headers):
        c = cap_tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        run = p.add_run(h)
        run.font.name = font_name
        run.font.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    members_data_pb = [
        ("ਸੁਰਿੰਦਰ ਸਿੰਘ", "ਮੁੱਖ ਸੰਸਥਾਪਕ ਅਤੇ 1ਲਾ ਸ਼ੇਅਰਹੋਲਡਰ\n(ਸਿਰਫ਼ ਸ਼ੇਅਰਹੋਲਡਰ / ਮਾਲਕ)", "870 ਸ਼ੇਅਰ", "87.00%", "ਪੈਸਿਵ ਸ਼ੇਅਰਹੋਲਡਰ / ਨਿਵੇਸ਼ਕ\n100% ਸੁਪਰੀਮ ਵੀਟੋ ਕੰਟਰੋਲ (>75%)\n(ਕੋਈ ਡਾਇਰੈਕਟਰਸ਼ਿਪ ਨਹੀਂ, 0% ਤਨਖਾਹ — ਸਰਕਾਰੀ ਰੂਲ 16 ਮੁਤਾਬਕ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ)"),
        ("ਬਖਸ਼ੀਸ਼ ਸਿੰਘ", "ਐਗਜ਼ੈਕਟਿਵ ਡਾਇਰੈਕਟਰ 1\n+ ਸ਼ੇਅਰਹੋਲਡਰ", "100 ਸ਼ੇਅਰ", "10.00%", "ਕੰਮ ਕਰਨ ਵਾਲਾ ਵਰਕਿੰਗ ਡਾਇਰੈਕਟਰ\n(DIN, DSC ਅਤੇ DIR-2 ਦਸਤਖਤਕਾਰ)"),
        ("ਗਗਨਦੀਪ ਕੌਰ", "ਐਗਜ਼ੈਕਟਿਵ ਡਾਇਰੈਕਟਰ 2\n+ ਸ਼ੇਅਰਹੋਲਡਰ", "30 ਸ਼ੇਅਰ", "3.00%", "ਕੰਮ ਕਰਨ ਵਾਲੀ ਵਰਕਿੰਗ ਡਾਇਰੈਕਟਰ\n(DIN, DSC ਅਤੇ DIR-2 ਦਸਤਖਤਕਾਰ)"),
        ("ਕੁੱਲ ਜੋੜ (TOTAL)", "2 ਡਾਇਰੈਕਟਰ + 3 ਸ਼ੇਅਰਹੋਲਡਰ", "1,000 ਸ਼ੇਅਰ", "100.00%", "ਪੂਰੀ ਜਮ੍ਹਾਂ ਇਕੁਇਟੀ ਪੂੰਜੀ (ICICI Bank Current Account)")
    ]

    for row_idx, data in enumerate(members_data_pb, start=1):
        for col_idx, text in enumerate(data):
            c = cap_tbl.cell(row_idx, col_idx)
            if row_idx == 4:
                set_cell_background(c, "DCFCE7")
            elif row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = font_name
            run.font.size = Pt(9)
            run.font.color.rgb = dark_text
            if col_idx == 0 or row_idx == 4:
                run.font.bold = True
            if col_idx == 3:
                run.font.bold = True
                run.font.color.rgb = primary_color

    p_cap_note = doc.add_paragraph()
    p_cap_note.paragraph_format.space_before = Pt(6)
    p_cap_note.add_run("ਅਧਿਕਾਰਤ ਪੂੰਜੀ (Authorized Capital): ").font.bold = True
    p_cap_note.add_run("₹ 1,00,000 (10,000 ਇਕੁਇਟੀ ਸ਼ੇਅਰ, ₹10 ਪ੍ਰਤੀ ਸ਼ੇਅਰ)\n")
    p_cap_note.add_run("ਜਮ੍ਹਾਂ ਪੂੰਜੀ (Paid-up Capital): ").font.bold = True
    p_cap_note.add_run("₹ 10,000 (1,000 ਇਕੁਇਟੀ ਸ਼ੇਅਰ, ₹10 ਪ੍ਰਤੀ ਸ਼ੇਅਰ)\n")
    p_cap_note.add_run("ਨਿਰਧਾਰਤ ਬੈਂਕ ਖਾਤਾ: ").font.bold = True
    p_cap_note.add_run("ICICI Bank (iStartup 2.0 Current Account) via AGILE-PRO-S (INC-35)")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 6: ਕਾਨੂੰਨੀ ਫਾਰਮੈਟ: DIR-2, INC-9, NOC
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. ਕਾਨੂੰਨੀ ਫਾਰਮੈਟ ਅਤੇ ਹਲਫੀਆ ਬਿਆਨ: DIR-2, INC-9 ਅਤੇ ਰਜਿਸਟਰਡ ਆਫਿਸ NOC")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    # 6.1 FORM DIR-2
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.1 ਫਾਰਮ DIR-2: ਡਾਇਰੈਕਟਰ ਬਣਨ ਦੀ ਲਿਖਤੀ ਸਹਿਮਤੀ (ਧਾਰਾ 152(5))")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    dir2_text_pb = (
        "ਸੇਵਾ ਵਿਖੇ,\n"
        "ਬੋਰਡ ਆਫ ਡਾਇਰੈਕਟਰਜ਼ / ਪ੍ਰਮੋਟਰਜ਼,\n"
        "ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ (FARMSKING TECHNOLOGIES PRIVATE LIMITED)\n"
        "[ਪ੍ਰਸਤਾਵਿਤ ਰਜਿਸਟਰਡ ਦਫ਼ਤਰ ਦਾ ਪਤਾ: ____________________________________]\n\n"
        "ਵਿਸ਼ਾ: ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ ਦੇ ਡਾਇਰੈਕਟਰ ਵਜੋਂ ਕੰਮ ਕਰਨ ਲਈ ਸਹਿਮਤੀ ਪੱਤਰ\n\n"
        "ਮੈਂ, [ਡਾਇਰੈਕਟਰ ਦਾ ਨਾਮ], ਪੁੱਤਰ/ਧੀ/ਪਤਨੀ [ਪਿਤਾ/ਪਤੀ ਦਾ ਨਾਮ], ਵਾਸੀ [ਪੂਰਾ ਪਤਾ], ਕੰਪਨੀ ਕਾਨੂੰਨ 2013 ਦੀ ਧਾਰਾ 152 ਦੀ ਉਪ-ਧਾਰਾ (5) ਅਧੀਨ "
        "ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ ਦੇ ਡਾਇਰੈਕਟਰ ਵਜੋਂ ਕੰਮ ਕਰਨ ਲਈ ਆਪਣੀ ਸਹਿਮਤੀ ਦਿੰਦਾ/ਦਿੰਦੀ ਹਾਂ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ ਕਿ ਮੈਂ ਕੰਪਨੀ ਕਾਨੂੰਨ 2013 ਅਧੀਨ ਡਾਇਰੈਕਟਰ ਬਣਨ ਲਈ ਅਯੋਗ (Disqualified) ਨਹੀਂ ਹਾਂ।\n\n"
        "1. ਡਾਇਰੈਕਟਰ ਆਈਡੈਂਟੀਫਿਕੇਸ਼ਨ ਨੰਬਰ (DIN): [ਜੇਕਰ ਪਹਿਲਾਂ ਹੈ, ਨਹੀਂ ਤਾਂ SPICe+ ਵਿੱਚ ਅਪਲਾਈ ਹੋਵੇਗਾ]\n"
        "2. ਪੂਰਾ ਨਾਮ (PAN ਕਾਰਡ ਮੁਤਾਬਕ): [ਪੂਰਾ ਨਾਮ]\n"
        "3. ਪਿਤਾ ਦਾ ਨਾਮ: [ਪਿਤਾ ਦਾ ਨਾਮ]\n"
        "4. ਪੱਕਾ ਰਿਹਾਇਸ਼ੀ ਪਤਾ: [ਪਤਾ, ਜ਼ਿਲ੍ਹਾ, ਪਿੰਡ/ਸ਼ਹਿਰ, ਪਿੰਨ ਕੋਡ]\n"
        "5. ਈ-ਮੇਲ ਆਈਡੀ: [Email] | ਮੋਬਾਈਲ ਨੰਬਰ: [Mobile Number]\n"
        "6. ਪੈਨ ਕਾਰਡ ਨੰਬਰ: [PAN Number] | ਜਨਮ ਮਿਤੀ: [DD/MM/YYYY] | ਕੌਮੀਅਤ: ਭਾਰਤੀ\n\n"
        "ਘੋਸ਼ਣਾ:\n"
        "ਮੈਂ ਘੋਸ਼ਣਾ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ ਕਿ ਮੈਨੂੰ ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦੌਰਾਨ ਕਿਸੇ ਵੀ ਕੰਪਨੀ ਦੀ ਸਥਾਪਨਾ, ਪ੍ਰਬੰਧਨ ਜਾਂ ਧੋਖਾਧੜੀ ਦੇ ਸਬੰਧ ਵਿੱਚ ਕਿਸੇ ਅਦਾਲਤ ਦੁਆਰਾ ਦੋਸ਼ੀ ਨਹੀਂ ਠਹਿਰਾਇਆ ਗਿਆ ਹੈ। "
        "ਮੈਂ ਕੰਪਨੀ ਕਾਨੂੰਨ ਦੇ ਸਾਰੇ ਨਿਯਮਾਂ ਦੀ ਪਾਲਣਾ ਕਰਾਂਗਾ/ਕਰਾਂਗੀ।\n\n"
        "ਮਿਤੀ: _______________          ਸਥਾਨ: ਪੰਜਾਬ, ਭਾਰਤ          ਦਸਤਖਤ: __________________________\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(dir2_text_pb)
    r_box.font.name = font_name
    r_box.font.size = Pt(9)

    # 6.2 FORM INC-9
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.2 ਫਾਰਮ INC-9: ਸ਼ੇਅਰਧਾਰਕਾਂ ਅਤੇ ਡਾਇਰੈਕਟਰਾਂ ਦਾ ਕਾਨੂੰਨੀ ਹਲਫੀਆ ਬਿਆਨ (ਧਾਰਾ 7(1)(c))")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    inc9_text_pb = (
        "ਕਾਨੂੰਨੀ ਘੋਸ਼ਣਾ ਪੱਤਰ (MEMORANDUM OF DECLARATION)\n\n"
        "ਮੈਂ, [ਸ਼ੇਅਰਹੋਲਡਰ / ਡਾਇਰੈਕਟਰ ਦਾ ਨਾਮ], ਵਾਸੀ [ਪੂਰਾ ਪਤਾ], ਸਹੁੰ ਚੁੱਕ ਕੇ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਬਿਆਨ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ:\n\n"
        "1. ਕਿ ਮੈਨੂੰ ਕਿਸੇ ਵੀ ਕੰਪਨੀ ਦੀ ਸਥਾਪਨਾ ਜਾਂ ਪ੍ਰਬੰਧਨ ਸਬੰਧੀ ਕਿਸੇ ਵੀ ਅਪਰਾਧ ਵਿੱਚ ਦੋਸ਼ੀ ਨਹੀਂ ਠਹਿਰਾਇਆ ਗਿਆ ਹੈ;\n"
        "2. ਕਿ ਮੈਨੂੰ ਕੰਪਨੀ ਕਾਨੂੰਨ 2013 ਜਾਂ ਪਿਛਲੇ ਕੰਪਨੀ ਕਾਨੂੰਨਾਂ ਤਹਿਤ ਪਿਛਲੇ 5 ਸਾਲਾਂ ਵਿੱਚ ਕਿਸੇ ਵੀ ਧੋਖਾਧੜੀ ਜਾਂ ਡਿਊਟੀ ਦੀ ਉਲੰਘਣਾ ਦਾ ਦੋਸ਼ੀ ਨਹੀਂ ਪਾਇਆ ਗਿਆ ਹੈ;\n"
        "3. ਕਿ ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ ਦੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਲਈ ਰਜਿਸਟਰਾਰ (ROC) ਕੋਲ ਜਮ੍ਹਾਂ ਕਰਵਾਏ ਗਏ ਸਾਰੇ ਦਸਤਾਵੇਜ਼ ਮੇਰੀ ਪੂਰੀ ਜਾਣਕਾਰੀ ਅਤੇ ਵਿਸ਼ਵਾਸ ਅਨੁਸਾਰ ਬਿਲਕੁਲ ਸਹੀ, ਸੰਪੂਰਨ ਅਤੇ ਸੱਚੇ ਹਨ;\n"
        "4. ਕਿ ਇਹ ਕੰਪਨੀ ਮੈਮੋਰੈਂਡਮ ਆਫ ਐਸੋਸੀਏਸ਼ਨ (MoA) ਵਿੱਚ ਦਰਜ ਮੁੱਖ ਉਦੇਸ਼ਾਂ ਅਨੁਸਾਰ ਡਿਜੀਟਲ ਖੇਤੀ ਵਿਕਾਸ, ਕਿਸਾਨ ਸਿੱਖਿਆ ਅਤੇ ਹੁਨਰ ਵਿਕਾਸ, ਲੋਕ ਭਲਾਈ ਕਾਰਜਾਂ ਅਤੇ ਖੇਤੀਬਾੜੀ ਈ-ਕਾਮਰਸ ਦਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਜਾਇਜ਼ ਅਤੇ ਇਮਾਨਦਾਰੀ ਵਾਲਾ ਕਾਰੋਬਾਰ ਕਰੇਗੀ।\n\n"
        "ਅੱਜ ਮਿਤੀ _____ ਮਹੀਨਾ ____________ 2026 ਨੂੰ ਪੰਜਾਬ ਵਿਖੇ ਤਸਦੀਕ ਕੀਤਾ ਗਿਆ।\n\n"
        "ਬਿਆਨਕਰਤਾ ਦੇ ਦਸਤਖਤ: __________________________     ਨਾਮ: [ਨਾਮ]     PAN: [PAN ਨੰਬਰ]\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(inc9_text_pb)
    r_box.font.name = font_name
    r_box.font.size = Pt(9)

    # 6.3 NOC FOR REGISTERED OFFICE
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.3 ਰਜਿਸਟਰਡ ਆਫਿਸ ਲਈ ਬੇ-ਇਤਰਾਜ਼ੀ ਸਰਟੀਫਿਕੇਟ (NOC FORM)")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    noc_text_pb = (
        "ਬੇ-ਇਤਰਾਜ਼ੀ ਸਰਟੀਫਿਕੇਟ (NO OBJECTION CERTIFICATE - NOC)\n"
        "(ਜਿਸ ਕਿਸੇ ਨਾਲ ਵੀ ਸਬੰਧਤ ਹੋਵੇ)\n\n"
        "ਮੈਂ, [ਜਾਇਦਾਦ ਦੇ ਮਾਲਕ ਦਾ ਨਾਮ], ਸਪੁੱਤਰ/ਸਪੁੱਤਰੀ [ਪਿਤਾ ਦਾ ਨਾਮ], ਵਾਸੀ [ਮਾਲਕ ਦਾ ਪੂਰਾ ਪਤਾ], ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਬਿਆਨ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ:\n\n"
        "1. ਕਿ ਮੈਂ ਹੇਠ ਲਿਖੇ ਪਤੇ 'ਤੇ ਸਥਿਤ ਜਾਇਦਾਦ ਦਾ ਅਸਲ ਕਾਨੂੰਨੀ ਮਾਲਕ ਹਾਂ ਅਤੇ ਇਹ ਜਾਇਦਾਦ ਮੇਰੇ ਕਾਨੂੰਨੀ ਕਬਜ਼ੇ ਵਿੱਚ ਹੈ:\n"
        "   [ਰਜਿਸਟਰਡ ਆਫਿਸ ਦਾ ਪੂਰਾ ਪਤਾ, ਗਲੀ/ਮੁਹੱਲਾ, ਪਿੰਡ/ਸ਼ਹਿਰ, ਜ਼ਿਲ੍ਹਾ, ਪੰਜਾਬ, ਪਿੰਨ ਕੋਡ]।\n\n"
        "2. ਕਿ ਮੈਨੂੰ ਇਸ ਗੱਲ 'ਤੇ ਕੋਈ ਵੀ ਇਤਰਾਜ਼ ਨਹੀਂ ਹੈ ਜੇਕਰ ਪ੍ਰਸਤਾਵਿਤ ਕੰਪਨੀ 'ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ' (FARMSKING TECHNOLOGIES PRIVATE LIMITED) "
        "ਜਾਂ ਕਾਰਪੋਰੇਟ ਮਾਮਲਿਆਂ ਦੇ ਮੰਤਰਾਲੇ (MCA) ਦੁਆਰਾ ਮਨਜ਼ੂਰ ਕੀਤਾ ਕੋਈ ਹੋਰ ਨਾਮ, ਇਸ ਉਪਰੋਕਤ ਜਗ੍ਹਾ ਨੂੰ ਆਪਣੀ ਕੰਪਨੀ ਦੇ ਰਜਿਸਟਰਡ ਦਫ਼ਤਰ (REGISTERED OFFICE) ਵਜੋਂ ਵਰਤੇ "
        "ਅਤੇ ਇੱਥੇ ਆਪਣੇ ਪ੍ਰਬੰਧਕੀ, ਡਿਜੀਟਲ ਪਲੇਟਫਾਰਮ, ਸਿਖਲਾਈ ਅਤੇ ਵਪਾਰਕ ਕੰਮਕਾਜ ਚਲਾਵੇ।\n\n"
        "3. ਕਿ ਕੰਪਨੀ ਇਸ ਪਤੇ 'ਤੇ GST ਨੰਬਰ, MSME ਉਦਯਮ ਸਰਟੀਫਿਕੇਟ ਲੈ ਸਕਦੀ ਹੈ ਅਤੇ ਬੈਂਕ ਵਿੱਚ ਖਾਤਾ ਖੋਲ੍ਹ ਸਕਦੀ ਹੈ, ਮੈਨੂੰ ਇਸ 'ਤੇ ਕੋਈ ਇਤਰਾਜ਼ ਨਹੀਂ ਹੈ।\n\n"
        "ਨਾਲ ਨੱਥੀ ਦਸਤਾਵੇਜ਼:\n"
        "- ਬਿਜਲੀ ਦੇ ਬਿੱਲ ਦੀ ਕਾਪੀ (2 ਮਹੀਨਿਆਂ ਤੋਂ ਪੁਰਾਣਾ ਨਾ ਹੋਵੇ)\n"
        "- ਮਾਲਕ ਦੇ ਪੈਨ ਕਾਰਡ ਅਤੇ ਆਧਾਰ ਕਾਰਡ ਦੀ ਕਾਪੀ (ਪਛਾਣ ਦੇ ਸਬੂਤ ਵਜੋਂ)\n\n"
        "ਮਿਤੀ: _______________     ਸਥਾਨ: ਪੰਜਾਬ, ਭਾਰਤ     ਮਾਲਕ ਦੇ ਦਸਤਖਤ: __________________________ (ਨਾਮ ਅਤੇ ਫੋਨ ਨੰਬਰ)\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(noc_text_pb)
    r_box.font.name = font_name
    r_box.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 7: ਕੰਪਨੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਦਾ 7-ਸਟੈਪ ਪ੍ਰੋਸੈਸ
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. ਕੰਪਨੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਦਾ 7-ਸਟੈਪ ਪ੍ਰੋਸੈਸ ਅਤੇ ਦਸਤਾਵੇਜ਼ ਚੈੱਕਲਿਸਟ")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(13.5)
    r.font.bold = True

    steps_pb = [
        ("ਸਟੈਪ 1: ਕੰਪਨੀ ਦਾ ਨਾਮ ਰਿਜ਼ਰਵ ਕਰਨਾ (SPICe+ Part A)", "ਸਰਕਾਰੀ ਪੋਰਟਲ 'ਤੇ 'FARMSKING TECHNOLOGIES PRIVATE LIMITED' ਨਾਮ ਅਪਲਾਈ ਕਰਨਾ, ਜਿਸ ਵਿੱਚ NIC ਕੋਡ 62013 ਅਤੇ ਨਾਮ ਦਾ ਉਦੇਸ਼ ਦਿੱਤਾ ਜਾਵੇਗਾ।"),
        ("ਸਟੈਪ 2: ਡਿਜੀਟਲ ਦਸਤਖਤ (DSC ਬਣਾਉਣਾ)", "ਕੰਮ ਕਰਨ ਵਾਲੇ ਡਾਇਰੈਕਟਰਾਂ (ਚਰਨਜੀਤ ਸਿੰਘ, ਗੁਰਨਾਮ ਸਿੰਘ ਆਦਿ) ਦੇ ਮੋਬਾਈਲ ਰਾਹੀਂ 1 ਮਿੰਟ ਦੀ ਵੀਡੀਓ ਕੇਵਾਈਸੀ ਨਾਲ ਡਿਜੀਟਲ ਸਾਈਨ ਬਣਨਗੇ।"),
        ("ਸਟੈਪ 3: SPICe+ Part B ਅਤੇ e-MoA (INC-33) ਫਾਈਲਿੰਗ", "ਇਸ ਫਾਈਲ ਦੇ ਸੈਕਸ਼ਨ 2 ਵਿੱਚ ਦਿੱਤੇ 6 ਮੁੱਖ ਉਦੇਸ਼ (Main Objects) ਅਤੇ ਸੈਕਸ਼ਨ 3 ਦੇ 17 ਸਹਾਇਕ ਉਦੇਸ਼ ਸਰਕਾਰੀ ਫਾਰਮ ਵਿੱਚ ਪੇਸਟ ਕੀਤੇ ਜਾਣਗੇ।"),
        ("ਸਟੈਪ 4: e-AoA (INC-34) ਕੰਪਨੀ ਨਿਯਮ", "ਕੰਪਨੀ ਦੇ ਅੰਦਰੂਨੀ ਨਿਯਮਾਂ ਵਿੱਚ ਟੇਬਲ F ਅਤੇ ਸ਼ੇਅਰ ਟਰਾਂਸਫਰ ਦੀਆਂ ਸ਼ਰਤਾਂ ਲਗਾਈਆਂ ਜਾਣਗੀਆਂ ਤਾਂ ਜੋ ਸੁਰਿੰਦਰ ਸਿੰਘ ਜੀ ਦਾ 80% ਸੁਪਰੀਮ ਕੰਟਰੋਲ ਰਹੇ।"),
        ("ਸਟੈਪ 5: AGILE-PRO-S (ਇਕੱਠੇ ਸਾਰੇ ਲਾਇਸੰਸ)", "ਇੱਕੋ ਫਾਰਮ ਰਾਹੀਂ ਕੰਪਨੀ ਦਾ GSTIN ਨੰਬਰ, ICICI/HDFC ਬੈਂਕ ਕਰੰਟ ਅਕਾਊਂਟ, ਅਤੇ ਪੰਜਾਬ ਪ੍ਰੋਫੈਸ਼ਨਲ ਟੈਕਸ ਅਪਲਾਈ ਹੋ ਜਾਵੇਗਾ।"),
        ("ਸਟੈਪ 6: ਸਰਕਾਰੀ ਸਰਟੀਫਿਕੇਟ (Certificate of Incorporation)", "7 ਤੋਂ 10 ਦਿਨਾਂ ਵਿੱਚ ਕੇਂਦਰ ਸਰਕਾਰ ਦੇ ਕਾਰਪੋਰੇਟ ਮਾਮਲਿਆਂ ਦੇ ਮੰਤਰਾਲੇ ਵੱਲੋਂ CIN ਨੰਬਰ, PAN ਕਾਰਡ ਅਤੇ TAN ਕਾਰਡ ਵਾਲਾ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਸਰਟੀਫਿਕੇਟ ਮਿਲੇਗਾ।"),
        ("ਸਟੈਪ 7: ਬੈਂਕ ਖਾਤਾ ਚਾਲੂ ਹੋਣਾ ਅਤੇ ਸਟਾਰਟਅੱਪ ਇੰਡੀਆ", "ਬੈਂਕ ਖਾਤਾ ਐਕਟੀਵੇਟ ਹੋਵੇਗਾ ਅਤੇ 'startupindia.gov.in' 'ਤੇ DPIIT ਸਰਟੀਫਿਕੇਟ ਅਪਲਾਈ ਕਰਕੇ 3 ਸਾਲ ਦੀ ਇਨਕਮ ਟੈਕਸ ਛੋਟ ਪ੍ਰਾਪਤ ਕੀਤੀ ਜਾਵੇਗੀ।")
    ]

    for title, desc in steps_pb:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(3)
        p_st.paragraph_format.space_after = Pt(3)
        r_t = p_st.add_run(f"✔️ {title}: ")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_st.add_run(desc)
        r_d.font.name = font_name
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Footer note
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_p.add_run("👑 ਫਾਰਮਜ਼ਕਿੰਗ ਟੈਕਨੋਲੋਜੀਜ਼ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ — ਡਿਜੀਟਲ ਖੇਤੀ, ਕਿਸਾਨ ਸਿੱਖਿਆ ਅਤੇ ਲੋਕ ਭਲਾਈ ਨੂੰ ਸਮਰਪਿਤ")
    footer_run.font.name = font_name
    footer_run.font.size = Pt(10.5)
    footer_run.font.bold = True
    footer_run.font.color.rgb = primary_color

    # Save destinations
    desktop_path = r"C:\Users\hp\Desktop\farmsking_punjabi.docx"
    local_path = r"d:\FarmsKing\farmsking_punjabi.docx"

    doc.save(desktop_path)
    print(f"Successfully saved Punjabi Word document to Desktop: {desktop_path}")

    doc.save(local_path)
    print(f"Successfully saved Punjabi Word document to Project root: {local_path}")

if __name__ == "__main__":
    create_punjabi_document()
