import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def clean_markdown_line(line):
    # Remove emojis or characters that may break standard fonts if needed, or escape xml
    line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Convert bold **text** -> <b>text</b>
    pattern = re.compile(r'\*\*(.*?)\*\*')
    line = pattern.sub(r'<b>\1</b>', line)

    # Convert inline code `text` -> <font name="Courier">\1</font>
    code_pattern = re.compile(r'`(.*?)`')
    line = code_pattern.sub(r'<font name="Courier">\1</font>', line)
    
    return line

def md_to_pdf(md_file_path, pdf_file_path):
    doc = SimpleDocTemplate(
        pdf_file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#15803d'),
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#166534'),
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        spaceAfter=3
    )

    story = []

    with open(md_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_table = False

    for line in lines:
        raw = line.strip()
        if not raw:
            story.append(Spacer(1, 4))
            continue
        
        # Table rows in markdown
        if raw.startswith('|'):
            cols = [clean_markdown_line(c.strip()) for c in raw.split('|')[1:-1]]
            if all(c.replace('-', '').strip() == '' for c in cols):
                continue # Header separator row
            row_text = " &nbsp;&nbsp;|&nbsp;&nbsp; ".join(cols)
            story.append(Paragraph(f"• {row_text}", bullet_style))
            continue

        if raw.startswith('# '):
            text = clean_markdown_line(raw[2:])
            story.append(Paragraph(text, title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#15803d'), spaceAfter=10))
        elif raw.startswith('## '):
            text = clean_markdown_line(raw[3:])
            story.append(Paragraph(text, h2_style))
        elif raw.startswith('### '):
            text = clean_markdown_line(raw[4:])
            story.append(Paragraph(text, h3_style))
        elif raw.startswith('* ') or raw.startswith('- '):
            text = clean_markdown_line(raw[2:])
            story.append(Paragraph(f"• {text}", bullet_style))
        elif re.match(r'^\d+\.\s', raw):
            text = clean_markdown_line(re.sub(r'^\d+\.\s', '', raw))
            story.append(Paragraph(f"• {text}", bullet_style))
        elif raw.startswith('> '):
            text = clean_markdown_line(raw[2:])
            quote_style = ParagraphStyle(
                'Quote_Custom',
                parent=body_style,
                fontName='Helvetica-Oblique',
                textColor=colors.HexColor('#15803d'),
                leftIndent=20,
                rightIndent=20,
                spaceBefore=4,
                spaceAfter=4
            )
            story.append(Paragraph(text, quote_style))
        else:
            text = clean_markdown_line(raw)
            story.append(Paragraph(text, body_style))

    doc.build(story)
    print(f"Generated PDF successfully: {pdf_file_path}")

os.makedirs(r"d:\FarmsKing\docs\admin", exist_ok=True)

md_to_pdf(
    r"d:\FarmsKing\docs\admin\trainer_system_admin_guide.md",
    r"d:\FarmsKing\docs\admin\trainer_system_admin_guide.pdf"
)

md_to_pdf(
    r"d:\FarmsKing\docs\trainers\trainer_job_role_handbook.md",
    r"d:\FarmsKing\docs\admin\trainer_job_role_handbook.pdf"
)
