import sys
import os
import re
import subprocess
import glob

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def md_to_html(md_text, title):
    # Convert markdown headers
    lines = md_text.split('\n')
    html_lines = []
    in_list = False
    in_table = False
    table_rows = []

    for line in lines:
        raw = line.strip()
        
        # Handle Table
        if raw.startswith('|'):
            cols = [c.strip() for c in raw.split('|')[1:-1]]
            if all(c.replace('-', '').strip() == '' for c in cols):
                continue
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(cols)
            continue
        elif in_table:
            in_table = False
            # Render Table HTML
            if table_rows:
                t_html = "<table class='custom-table'><thead><tr>"
                for h in table_rows[0]:
                    t_html += f"<th>{h}</th>"
                t_html += "</tr></thead><tbody>"
                for row in table_rows[1:]:
                    t_html += "<tr>" + "".join([f"<td>{c}</td>" for c in row]) + "</tr>"
                t_html += "</tbody></table>"
                html_lines.append(t_html)

        if not raw:
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            html_lines.append("<br>")
            continue

        # Format inline styles
        formatted = raw
        formatted = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', formatted)
        formatted = re.sub(r'`(.*?)`', r'<code>\1</code>', formatted)

        if raw.startswith('# '):
            html_lines.append(f"<h1 class='doc-title'>{formatted[2:]}</h1><hr class='divider'>")
        elif raw.startswith('## '):
            html_lines.append(f"<h2 class='doc-h2'>{formatted[3:]}</h2>")
        elif raw.startswith('### '):
            html_lines.append(f"<h3 class='doc-h3'>{formatted[4:]}</h3>")
        elif raw.startswith('* ') or raw.startswith('- '):
            if not in_list:
                html_lines.append("<ul class='custom-list'>")
                in_list = True
            html_lines.append(f"<li>{formatted[2:]}</li>")
        elif raw.startswith('> '):
            html_lines.append(f"<div class='quote-box'>{formatted[2:]}</div>")
        else:
            html_lines.append(f"<p class='doc-p'>{formatted}</p>")

    if in_list:
        html_lines.append("</ul>")

    full_body = "\n".join(html_lines)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Gurmukhi:wght@400;600;700&display=swap');
  
  @page {{
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }}

  body {{
    font-family: 'Inter', 'Noto Sans Gurmukhi', 'Arial', sans-serif;
    color: #0f172a;
    line-height: 1.6;
    font-size: 13px;
    background-color: #ffffff;
    padding: 10px;
  }}

  .doc-title {{
    color: #15803d;
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }}

  .divider {{
    border: none;
    height: 2.5px;
    background: linear-gradient(90deg, #15803d, #86efac);
    margin-bottom: 18px;
    border-radius: 2px;
  }}

  .doc-h2 {{
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
    margin-top: 18px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
  }}

  .doc-h3 {{
    color: #166534;
    font-size: 13.5px;
    font-weight: 700;
    margin-top: 12px;
    margin-bottom: 6px;
  }}

  .doc-p {{
    font-size: 12.5px;
    color: #334155;
    margin-bottom: 6px;
  }}

  .custom-list {{
    margin-left: 18px;
    margin-bottom: 10px;
    color: #334155;
  }}

  .custom-list li {{
    margin-bottom: 4px;
  }}

  .quote-box {{
    background-color: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 10px 14px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 12px;
    color: #166534;
  }}

  .custom-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 11.5px;
  }}

  .custom-table th {{
    background-color: #15803d;
    color: #ffffff;
    font-weight: 700;
    padding: 8px 10px;
    text-align: left;
  }}

  .custom-table td {{
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }}

  .custom-table tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  code {{
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11.5px;
  }}
</style>
</head>
<body>
{full_body}
</body>
</html>
"""
    return full_html

def convert_all_ecommerce_docs():
    folder = "d:/FarmsKing/docs/ecommerce"
    md_files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith('.md')]
    
    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    print(f"Found {len(md_files)} markdown files in {folder}")

    for md_path in md_files:
        base_name = os.path.splitext(os.path.basename(md_path))[0]
        html_path = os.path.join(folder, f"{base_name}.html")
        pdf_path = os.path.join(folder, f"{base_name}.pdf")

        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()

        html_content = md_to_html(content, base_name.replace('_', ' '))

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"Generated HTML: {html_path}")

        # Convert HTML to PDF using Edge headless
        cmd = [
            edge_exe,
            "--headless",
            "--disable-gpu",
            f"--print-to-pdf={pdf_path}",
            html_path
        ]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if os.path.exists(pdf_path):
                print(f"✅ Generated PDF: {pdf_path}")
            else:
                print(f"⚠️ Failed PDF generation for {base_name}: {res.stderr}")
        except Exception as e:
            print(f"❌ Error printing PDF for {base_name}: {e}")

if __name__ == "__main__":
    convert_all_ecommerce_docs()
