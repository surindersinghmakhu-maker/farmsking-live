import sys
import os
import re
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# HTML Renderer
def md_to_html(md_text, title, lang="EN"):
    lines = md_text.split('\n')
    html_lines = []
    in_list = False
    in_table = False
    table_rows = []

    for line in lines:
        raw = line.strip()
        
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
<html lang="{lang.lower()}">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&display=swap');
  
  @page {{
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }}

  body {{
    font-family: 'Inter', 'Noto Sans Devanagari', 'Noto Sans Gurmukhi', 'Segoe UI', sans-serif;
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

# DOCUMENTS DATA (EN, HI, PA)
DOCUMENTS = {
    # 01 MASTER BOOKLET
    "01_Master_Ecommerce_Booklet_English": ("English", """# FarmsKing E-Commerce Master Manual & Operations Guide
**Complete Multi-Seller Marketplace Platform Blueprint**

---

## 1. Executive Overview
The FarmsKing E-Commerce Platform is a multi-seller marketplace engineered for agricultural inputs (seeds, fertilizers, pesticides, tools, heavy machinery). It seamlessly connects Sellers (Local Ag-Stores), Buyers (Farmers), Logistics (Shiprocket API), and Financial Compliance (1% GST TCS withholding).

---

## 2. Core Business Rules & Profit Split
* **FarmsKing Platform Fee**: 10% on gross item sale price.
* **GST TCS Rate**: 1% withheld from seller payout and deposited to the Government under Sec 52 CGST Act.
* **Free Delivery Rule (50-50 Cost Sharing)**:
  - If a seller offers Free Delivery, the shipping fee is shared **50-50% equally** between FarmsKing and the Seller.
  - **Example (Product ₹2000, Actual Shipping ₹400)**:
    - FarmsKing Commission (10%): ₹200
    - FarmsKing Share of Shipping: ₹200
    - Net FarmsKing Profit: ₹0 (No loss, 10% commission completely covers FarmsKing's share of shipping fee).
    - Seller Product Base: ₹1800
    - Seller Share of Shipping: ₹200
    - Seller Final Payout: ₹1600 (- 1% GST TCS).

---

## 3. Shipping & Logistics System
1. **Shiprocket API Integration**: Automatic pincode serviceability check, courier allocation (Delhivery, BlueDart, Ekart), and live tracking.
2. **Delivery Modes**:
   - **FarmsKing Courier (Shiprocket)**: Automatic door-step delivery.
   - **Seller Self-Delivery**: For heavy machinery or hyper-local deliveries.
   - **Local Store Pickup**: Farmer directly picks up from seller store (Zero delivery fee).

---

## 4. Key Stakeholders & Responsibilities
| Stakeholder | Primary Role | Key Focus |
|---|---|---|
| **Sellers** | Product listing, quality packaging, inventory accuracy | 10% commission, 50-50 free shipping rule, weekly payouts |
| **ICICI Bank** | E-Commerce Nodal / Escrow Account | Compliance with RBI aggregator rules, automated split APIs |
| **Chartered Accountant** | GST TCS Compliance & Filing | Monthly GSTR-8 return filing, TCS certificate generation |
| **Cashfree Gateway** | Online Payments & Split Payouts | Instant order payment processing, automated vendor split |
| **Shiprocket** | Multi-vendor pickup & shipping | API credentials, pickup location sync, return order logistics |

---

## 5. Dispute Resolution & Anti-Fraud Protocols
1. **Wrong/Damaged Product**: Mandatory Unboxing Video required from buyer; Seller must replace within 48h or 100% refund issued.
2. **Delayed Delivery**: Real-time tracking alerts sent via SMS/App. Orders delayed over 7 days can be cancelled with 100% refund.
3. **Refused Delivery (RTO)**: Return courier charges deducted from seller payout for invalid seller descriptions.
4. **Counterfeit Goods / Expired Chemicals**: Instant seller suspension + ₹10,000 penalty.

---

## 6. Official Terms & Conditions
- All sellers must possess valid GSTIN, PAN Card, and verified Bank Account.
- Sellers listing pesticides/fertilizers must upload valid State Agriculture Licenses.
- All payouts are settled every Thursday via Cashfree Auto-Payout API.
"""),

    "01_Master_Ecommerce_Booklet_Hindi": ("Hindi", """# फार्मਸਕਿੰਗ ਈ-ਕੋਮਰਸ ਮਾਸਟਰ ਮੈਨੂਅਲ ਅਤੇ ਸੰਚਾਲਨ ਗਾਈਡ
**ਮਲਟੀ-ਸੈਲਰ ਮਾਰਕੀਟਪਲੇਸ ਪਲੇਟਫਾਰਮ ਬਲੂਪ੍ਰਿੰਟ**

---

## 1. ਮੁੱਖ ਉਦੇਸ਼ (ਕਰਿਆਤਮਕ ਸਮੀਖਿਆ)
ਫਾਰਮਸਕਿੰਗ ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਖੇਤੀਬਾੜੀ ਉਤਪਾਦਾਂ (ਬੀਜ, ਖਾਦ, ਦਵਾਈਆਂ, ਔਜ਼ਾਰ, ਮਸ਼ੀਨਰੀ) ਦੀ ਖਰੀਦ-ਵੇਚ ਲਈ ਇੱਕ ਮਲਟੀ-ਸੈਲਰ ਮਾਰਕੀਟਪਲੇਸ ਹੈ। ਇਹ ਸੈਲਰਾਂ (ਦੁਕਾਨਦਾਰਾਂ), ਕਿਸਾਨਾਂ, ਲੌਜਿਸਟਿਕਸ (ਸ਼ਿਪਰੌਕੇਟ) ਅਤੇ ਵਿੱਤੀ ਕੰਪਲਾਇੰਸ (1% GST TCS) ਨੂੰ ਆਟੋਮੈਟਿਕ ਤਰੀਕੇ ਨਾਲ ਜੋੜਦਾ ਹੈ।

---

## 2. ਮੁੱਖ ਨਿਯਮ ਅਤੇ ਕਮਿਸ਼ਨ (ਬਿਜ਼ਨਸ ਮਾਡਲ)
* **फार्मਸਕਿੰਗ ਕਮਿਸ਼ਨ**: 10% (ਹਰ ਵਿਕਰੀ 'ਤੇ)।
* **GST TCS ਦਰ**: 1% (ਸਰਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਸੈਲਰ ਦੇ ਹਿੱਸੇ ਵਿੱਚੋਂ ਕੱਟ ਕੇ ਜਮ੍ਹਾਂ)।
* **ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਨਿਯਮ (50-50 ਖਰਚਾ ਵੰਡ)**:
  - ਜੇਕਰ ਸੈਲਰ ਕਿਸੇ ਪ੍ਰੋਡਕਟ 'ਤੇ ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਦਿੰਦਾ ਹੈ, ਤਾਂ ਉਸ ਦਾ ਖਰਚਾ ਫਾਰਮਸਕਿੰਗ ਅਤੇ ਸੈਲਰ **50-50% ਅੱਧਾ-ਅੱਧਾ** ਚੁੱਕਣਗੇ।
  - **ਉਦਾਹਰਨ (₹2000 ਦਾ ਪ੍ਰੋਡਕਟ, ₹400 ਡਿਲਿਵਰੀ ਖਰਚਾ)**:
    - ਫਾਰਮਸਕਿੰਗ ਕਮਿਸ਼ਨ (10%): ₹200
    - ਫਾਰਮਸਕਿੰਗ ਦਾ ਡਿਲਿਵਰੀ ਹਿੱਸਾ: ₹200
    - ਫਾਰਮਸਕਿੰਗ ਦੀ ਨੈੱਟ ਕਮਾਈ: ₹0 (ਕੋਈ ਘਾਟਾ ਨਹੀਂ, 10% ਕਮਿਸ਼ਨ ਨਾਲ ਡਿਲਿਵਰੀ ਖਰਚਾ ਪੂਰਾ)।
    - ਸੈਲਰ ਪ੍ਰੋਡਕਟ ਕੀਮਤ: ₹1800
    - ਸੈਲਰ ਦਾ ਡਿਲਿਵਰੀ ਹਿੱਸਾ: ₹200
    - ਸੈਲਰ ਪੇਆਊਟ: ₹1600 (- 1% GST TCS).

---

## 3. ਸ਼ਿਪਿੰਗ ਅਤੇ ਲੌਜਿਸਟਿਕਸ ਸਿਸਟਮ
1. **Shiprocket API Integration**: ਆਟੋਮੈਟਿਕ ਪਿਨਕੋਡ ਚੈਕਿੰਗ, ਕੂਰੀਅਰ ਚੋਣ (Delhivery, BlueDart) ਅਤੇ ਲਾਈਵ ਟਰੈਕਿੰਗ।
2. **ਡਿਲਿਵਰੀ ਦੇ 3 ਤਰੀਕੇ**:
   - **FarmsKing Courier (Shiprocket)**: ਡੋਰ-ਸਟੈਪ ਡਿਲਿਵਰੀ।
   - **Seller Self-Delivery**: ਭਾਰੀ ਮਸ਼ੀਨਰੀ ਲਈ ਸੈਲਰ ਆਪ ਡਿਲਿਵਰ ਕਰਦਾ ਹੈ।
   - **Local Store Pickup**: ਕਿਸਾਨ ਆਪ ਦੁਕਾਨ ਤੋਂ ਸਮਾਨ ਚੱਕ ਸਕਦਾ ਹੈ (ਜ਼ੀਰੋ ਡਿਲਿਵਰੀ ਫੀਸ)।

---

## 4. ਮੁੱਖ ਧਿਰਾਂ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ
| ਧਿਰ | ਮੁੱਖ ਜ਼ਿੰਮੇਵਾਰੀ | ਗੱਲਬਾਤ ਦਾ ਮੁੱਖ ਵਿਸ਼ਾ |
|---|---|---|
| **ਸੈਲਰ (ਦੁਕਾਨਦਾਰ)** | ਪ੍ਰੋਡਕਟ ਲਿਸਟਿੰਗ, ਸਹੀ ਪੈਕਿੰਗ, ਸਟਾਕ ਮੈਨੇਜਮੈਂਟ | 10% ਕਮਿਸ਼ਨ, 50-50 ਸ਼ਿਪਿੰਗ ਨਿਯਮ, ਹਫ਼ਤਾਵਾਰ ਪੇਆਊਟ |
| **ICICI Bank** | ਈ-ਕੋਮਰਸ ਨੋਡਲ / ਐਸਕਰੋ ਅਕਾਊਂਟ | ਆਰ.ਬੀ.ਆਈ ਨਿਯਮ, ਆਟੋਮੈਟਿਕ ਸਪਲਿਟ API |
| **Chartered Accountant** | GST TCS ਕੰਪਲਾਇੰਸ ਅਤੇ ਫਾਈਲਿੰਗ | ਮਹੀਨਾਵਾਰ GSTR-8 ਰਿਟਰਨ ਫਾਈਲਿੰਗ, TCS ਸਰਟੀਫਿਕੇਟ |
| **Cashfree Gateway** | ਆਨਲਾਈਨ ਪੇਮੈਂਟ ਅਤੇ ਸਪਲਿਟ ਪੇਆਊਟ | ਆਰਡਰ ਪੇਮੈਂਟ, ਆਟੋਮੈਟਿਕ ਵੈਂਡਰ ਸਪਲਿਟ |
| **Shiprocket** | ਕੂਰੀਅਰ ਪਿਕਅੱਪ ਅਤੇ ਟਰੈਕਿੰਗ | ਪਿਕਅੱਪ ਐਡਰੈੱਸ, ਰਿਟਰਨ ਮੈਨੇਜਮੈਂਟ |

---

## 5. ਝਗੜੇ ਅਤੇ ਜੋਖਮ ਪ੍ਰਬੰਧਨ
1. **ਗਲਤ/ਖਰਾਬ ਸਮਾਨ**: ਅਨਬਾਕਸਿੰਗ ਵੀਡੀਓ ਲਾਜ਼ਮੀ; 48 ਘੰਟਿਆਂ 'ਚ ਰਿਪਲੇਸਮੈਂਟ ਜਾਂ 100% ਰਿਫੰਡ।
2. **ਡਿਲਿਵਰੀ 'ਚ ਦੇਰੀ**: ਐਪ 'ਚ ਲਾਈਵ ਟਰੈਕਿੰਗ; 7 ਦਿਨਾਂ ਤੋਂ ਵੱਧ ਦੇਰੀ 'ਤੇ 100% ਰਿਫੰਡ।
3. **RTO (ਰਿਫਿਊਜ਼ਡ ਡਿਲਿਵਰੀ)**: ਵਾਪਸੀ ਦਾ ਕੂਰੀਅਰ ਖਰਚਾ ਸੈਲਰ ਦੇ ਅਕਾਊਂਟ 'ਚੋਂ ਕੱਟਿਆ ਜਾਵੇਗਾ।
4. **ਨਕਲੀ ਸਮਾਨ**: ਸੈਲਰ ਬਲੌਕ + ₹10,000 ਜੁਰਮਾਨਾ।

---

## 6. ਨਿਯਮ ਅਤੇ ਸ਼ਰਤਾਂ
- ਸਾਰੇ ਸੈਲਰਾਂ ਕੋਲ GSTIN, PAN Card, ਅਤੇ ਬੈਂਕ ਅਕਾਊਂਟ ਹੋਣਾ ਲਾਜ਼ਮੀ ਹੈ।
- ਖਾਦ/ਦਵਾਈਆਂ ਵੇਚਣ ਵਾਲਿਆਂ ਕੋਲ ਵੈਧ ਖੇਤੀਬਾੜੀ ਲਾਇਸੈਂਸ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।
- ਪੇਆਊਟ ਹਰ ਵੀਰਵਾਰ Cashfree Auto-Payout API ਰਾਹੀਂ ਹੋਵੇਗਾ।
"""),

    "01_Master_Ecommerce_Booklet_Punjabi": ("Punjabi", """# FarmsKing E-Commerce Master Manual & Operations Guide
**ਈ-ਕੋਮਰਸ ਮਲਟੀ-ਸੈਲਰ ਸਟੋਰ ਮੈਨੇਜਮੈਂਟ ਸਿਸਟਮ - ਸੰਪੂਰਨ ਗਾਈਡ**

---

## 1. Executive Overview / ਮੁੱਖ ਉਦੇਸ਼
FarmsKing ਦਾ ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਖੇਤੀਬਾੜੀ ਉਤਪਾਦਾਂ (ਬੀਜ, ਖਾਦਾਂ, ਟੂਲਸ, ਮਸ਼ੀਨਰੀ) ਦੀ ਖਰੀਦ-ਵੇਚ ਲਈ ਇੱਕ ਮਲਟੀ-ਸੈਲਰ ਮਾਰਕੀਟਪਲੇਸ ਹੈ।
ਇਹ ਸਿਸਟਮ ਸੈਲਰਾਂ (ਸਟੋਰਾਂ), ਖਰੀਦਦਾਰਾਂ (ਕਿਸਾਨਾਂ), ਲੌਜਿਸਟਿਕਸ (ਕੂਰੀਅਰ ਪਾਰਟਨਰ) ਅਤੇ ਵਿੱਤੀ ਕੰਪਲਾਇੰਸ (GST TCS, Tax) ਨੂੰ ਆਟੋਮੈਟਿਕ ਤਰੀਕੇ ਨਾਲ ਜੋੜਦਾ ਹੈ।

---

## 2. Platform Core Rules & Financial Model / ਮੁੱਖ ਨਿਯਮ ਅਤੇ ਕਮਿਸ਼ਨ
* **FarmsKing Platform Fee**: 10% (ਹਰੇਕ ਵਿਕਰੀ 'ਤੇ)।
* **GST TCS Rate**: 1% (ਸਰਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਸੈਲਰ ਦੇ ਹਿੱਸੇ ਵਿੱਚੋਂ ਕੱਟ ਕੇ ਜਮ੍ਹਾਂ)।
* **Free Delivery Rule (ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਨਿਯਮ)**:
  - ਜੇਕਰ ਕਿਸੇ ਉਤਪਾਦ 'ਤੇ ਡਿਲਿਵਰੀ ਮੁਫ਼ਤ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ, ਤਾਂ ਉਸ ਦਾ ਖਰਚਾ FarmsKing ਅਤੇ Seller **50-50% ਅੱਧਾ-ਅੱਧਾ** ਵੰਡਣਗੇ।
  - ਉਦਾਹਰਨ: ₹2000 ਦਾ ਪ੍ਰੋਡਕਟ, ₹400 ਡਿਲਿਵਰੀ ਖਰਚਾ (ਮੁਫ਼ਤ ਦਿੱਤੀ)।
    * FarmsKing Margin (10%): ₹200
    * FarmsKing Share of Shipping: ₹200
    * Net FarmsKing Earning: ₹0 (ਕੋਈ ਘਾਟਾ ਨਹੀਂ, ₹0 ਜੇਬ ਵਿੱਚੋਂ)।
    * Seller Product Price: ₹1800
    * Seller Share of Shipping: ₹200
    * Seller Payout: ₹1600 (- GST TCS).

---

## 3. Shipping & Logistics System / ਡਿਲਿਵਰੀ ਸਿਸਟਮ
1. **Shiprocket API Integration**: ਆਟੋਮੈਟਿਕ ਪਿਨਕੋਡ ਚੈਕਿੰਗ, ਕੂਰੀਅਰ ਚੋਣ (Delhivery, BlueDart, Ekart) ਅਤੇ ਲਾਈਵ ਟਰੈਕਿੰਗ।
2. **Delivery Modes**:
   - **Seller Shipping**: ਸੈਲਰ ਆਪ ਡਿਲਿਵਰ ਕਰਦਾ ਹੈ।
   - **FarmsKing Courier (Shiprocket)**: FarmsKing ਦਾ ਆਟੋਮੈਟਿਕ ਕੂਰੀਅਰ ਸਿਸਟਮ।
   - **Local Store Pickup**: ਕਿਸਾਨ ਆਪ ਦੁਕਾਨ ਤੋਂ ਚੱਕ ਸਕਦਾ ਹੈ।

---

## 4. Key Parties & Communication Protocols / ਸਬੰਧਤ ਧਿਰਾਂ ਅਤੇ ਗੱਲਬਾਤ ਦੇ ਤਰੀਕੇ
| Party (ਧਿਰ) | Role & Responsibility (ਜ਼ਿੰਮੇਵਾਰੀ) | Communication Focus (ਗੱਲਬਾਤ ਦਾ ਵਿਸ਼ਾ) |
|---|---|---|
| **Sellers (ਵਪਾਰੀ)** | ਉਤਪਾਦ ਅੱਪਲੋਡ, ਪੈਕਿੰਗ, ਸਹੀ ਸਟਾਕ | ਰਜਿਸਟ੍ਰੇਸ਼ਨ, 10% ਕਮਿਸ਼ਨ, 50-50 ਡਿਲਿਵਰੀ ਨਿਯਮ, ਹਫ਼ਤਾਵਾਰ ਪੇਆਊਟ |
| **Bank (ICICI Bank)** | ਈ-ਕੋਮਰਸ ਨੋਡਲ / ਐਸਕਰੋ ਅਕਾਊਂਟ | ਨੋਡਲ ਅਕਾਊਂਟ ਖੋਲ੍ਹਣਾ, ਆਟੋਮੈਟਿਕ ਪੇਆਊਟ ਏਪੀਆਈ |
| **Chartered Accountant (CA)** | GSTR-8 ਫਾਈਲਿੰਗ & TCS ਡਿਪਾਜ਼ਿਟ | ਮਹੀਨਾਵਾਰ TCS ਰਿਪੋਰਟ, GSTR-8 ਸਬਮਿਸ਼ਨ, GST ਇਨਪੁਟ ਕ੍ਰੈਡਿਟ |
| **Payment Gateway (Cashfree)** | ਆਨਲਾਈਨ ਪੇਮੈਂਟ + ਆਟੋ ਸਪਲਿਟ ਪੇਆਊਟ | ਨੋਡਲ ਸਪਲਿਟ API, T+2 / T+7 ਪੇਆਊਟ ਸੈਟਲਮੈਂਟ |
| **Logistics (Shiprocket)** | ਕੂਰੀਅਰ ਪਿਕਅੱਪ, ਟਰੈਕਿੰਗ, ਆਰ.ਟੀ.ਓ | ਏਪੀਆਈ ਕੀਅਸ, ਪਿਕਅੱਪ ਐਡਰੈੱਸ, ਰਿਟਰਨ ਆਰਡਰ ਮੈਨੇਜਮੈਂਟ |

---

## 5. Dispute & Risk Management / ਝਗੜੇ ਅਤੇ ਸਮੱਸਿਆਵਾਂ ਦਾ ਹੱਲ
1. **Wrong/Damaged Product**: Unboxing ਵੀਡੀਓ ਲਾਜ਼ਮੀ; ਸੈਲਰ ਬਦਲ ਕੇ ਦੇਵੇਗਾ ਜਾਂ 100% ਰਿਫੰਡ।
2. **Delayed Delivery**: Shiprocket API ਰਾਹੀਂ ਟਰੈਕਿੰਗ ਸੂਚਨਾ ਕਿਸਾਨ ਨੂੰ SMS/App 'ਤੇ ਭੇਜੀ ਜਾਵੇਗੀ।
3. **RTO (Refused Delivery)**: ਰਿਟਰਨ ਡਿਲਿਵਰੀ ਖਰਚਾ ਸੈਲਰ ਦੇ ਪੇਆਊਟ ਵਿੱਚੋਂ ਕੱਟਿਆ ਜਾਵੇਗਾ।
4. **Fake Product / Expired Chemicals**: ਸੈਲਰ ਦਾ ਅਕਾਊਂਟ ਤੁਰੰਤ ਬਲੌਕ + ₹10,000 ਜੁਰਮਾਨਾ।

---

## 6. Official Terms & Conditions / ਕਾਨੂੰਨੀ ਸ਼ਰਤਾਂ
- ਸਾਰੇ ਸੈਲਰਾਂ ਕੋਲ ਵੈਧ GSTIN, PAN Card, ਅਤੇ ਬੈਂਕ ਅਕਾਊਂਟ ਹੋਣਾ ਲਾਜ਼ਮੀ ਹੈ।
- ਕੀਟਨਾਸ਼ਕ / ਦਵਾਈਆਂ ਵੇਚਣ ਵਾਲੇ ਸੈਲਰਾਂ ਕੋਲ ਵੈਧ ਖੇਤੀਬਾੜੀ ਲਾਇਸੈਂਸ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।
- ਸਾਰੇ ਪੇਆਊਟ GST TCS (1%) ਕੱਟ ਕੇ ਹਰ ਵੀਰਵਾਰ ਸੈਲਰ ਅਕਾਊਂਟ ਵਿੱਚ ਟਰਾਂਸਫਰ ਕੀਤੇ ਜਾਣਗੇ।
"""),

    # 02 FINANCIAL GUIDE
    "02_Financial_GST_TCS_Guide_English": ("English", """# FarmsKing Financial, Banking & GST TCS Compliance Guide
**Financial Rules, Nodal Banking, Tax and GST TCS Policy**

---

## 1. Banking Architecture Setup
Operating a compliant multi-seller marketplace requires two primary banking components:

1. **ICICI Bank E-Commerce Nodal / Escrow Account**:
   - Holds buyer funds temporarily before seller disbursement.
   - Built under RBI guidelines for E-Commerce Market Aggregators.
2. **Cashfree Marketplace Split Gateway**:
   - Automatically splits incoming payments: FarmsKing 10% commission goes to FarmsKing Current Account, while 90% (- 1% GST TCS) goes to the Seller's Account.

---

## 2. GST TCS (Tax Collected at Source) - 1% Rule
* **Statutory Requirement (Sec 52 CGST Act)**: Every e-commerce marketplace operator must deduct 1% GST TCS (0.5% CGST + 0.5% SGST or 1% IGST) on net seller sales.
* **Calculation Example**:
  - Item Sale Price: ₹1,000
  - GST TCS (1%): ₹10 (Deposited directly to the Govt portal under the seller's GSTIN).
  - Seller receives ₹10 as Input Tax Credit (ITC) to offset their monthly GST liability.

---

## 3. C.A. (Chartered Accountant) Reports & GSTR-8 Filing
FarmsKing Admin Portal features a dedicated C.A. Export Hub:
* **GSTR-8 Monthly Export**:
  - Filed monthly before the 10th.
  - CSV/Excel format contains: Seller GSTIN, Gross Sales, Returns, Net Taxable Value, and 1% TCS Amount.

---

## 4. Weekly Payout Schedule
- **Settlement Cycle**: T+7 days (7 days post-delivery to honor return windows).
- **Payout Day**: Every Thursday.
- **Automation**: Executed automatically via Cashfree Auto-Payout API.
"""),

    "02_Financial_GST_TCS_Guide_Hindi": ("Hindi", """# फार्मਸਕਿੰਗ ਵਿੱਤੀ, ਬੈਂਕਿੰਗ ਅਤੇ GST TCS ਗਾਈਡ
**ਵਿੱਤੀ ਨਿਯਮ, ਨੋਡਲ ਬੈਂਕਿੰਗ, ਟੈਕਸ ਅਤੇ GST TCS ਨੀਤੀ**

---

## 1. ਬੈਂਕਿੰਗ ਅਕਾਊਂਟ ਸੈੱਟਅੱਪ
ਈ-ਕੋਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਚਲਾਉਣ ਲਈ ਫਾਰਮਸਕਿੰਗ ਨੂੰ ਹੇਠ ਲਿਖੇ ਬੈਂਕ ਅਕਾਊਂਟ ਚਾਹੀਦੇ ਹਨ:

1. **ICICI Bank E-Commerce Nodal / Escrow Account**:
   - ਕਿਸਾਨਾਂ ਦਾ ਪੈਸਾ ਪਹਿਲਾਂ ਇਸ ਅਕਾਊਂਟ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦਾ ਹੈ।
   - ਆਰ.ਬੀ.ਆਈ (RBI) ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਲਈ ਤਿਆਰ।
2. **Cashfree Marketplace Split Gateway**:
   - ਪੇਮੈਂਟ ਮਿਲਦੇ ਹੀ ਫਾਰਮਸਕਿੰਗ ਦਾ 10% ਕਮਿਸ਼ਨ ਅਤੇ ਸੈਲਰ ਦਾ ਹਿੱਸਾ ਆਟੋਮੈਟਿਕ ਵੰਡਿਆ ਜਾਂਦਾ ਹੈ।

---

## 2. GST TCS (Tax Collected at Source) - 1% ਨਿਯਮ
* **ਸਰਕਾਰੀ ਨਿਯਮ (Sec 52 CGST Act)**: ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਲਈ ਹਰੇਕ ਸੈਲਰ ਦੀ ਵਿਕਰੀ 'ਤੇ 1% GST TCS (0.5% CGST + 0.5% SGST) ਕੱਟਣਾ ਲਾਜ਼ਮੀ ਹੈ।
* **ਹਿਸਾਬ-ਕਿਤਾਬ**:
  - ਉਤਪਾਦ ਕੀਮਤ: ₹1,000
  - GST TCS (1%): ₹10 (ਇਹ ਪੈਸਾ ਫਾਰਮਸਕਿੰਗ ਸਰਕਾਰ ਕੋਲ ਜਮ੍ਹਾਂ ਕਰਵਾਏਗਾ)।
  - ਸੈਲਰ ਨੂੰ ਇਹ ₹10 GST ਕ੍ਰੈਡਿਟ (ITC) ਵਜੋਂ ਵਾਪਸ ਮਿਲ ਜਾਣਗੇ।

---

## 3. C.A. ਰਿਪੋਰਟਾਂ ਅਤੇ GSTR-8 ਫਾਈਲਿੰਗ
ਫਾਰਮਸਕਿੰਗ ਐਡਮਿਨ ਪੈਨਲ ਵਿੱਚ C.A. ਲਈ ਖਾਸ ਐਕਸਪੋਰਟ ਸੈਕਸ਼ਨ:
* **GSTR-8 ਮੰਥਲੀ ਰਿਪੋਰਟ**:
  - ਹਰ ਮਹੀਨੇ ਦੀ 10 ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ GSTR-8 ਫਾਈਲ ਹੁੰਦੀ ਹੈ।
  - Excel/CSV ਵਿੱਚ: GSTIN, Total Sales, Returned Sales, TCS Amount ਸ਼ਾਮਲ ਹੁੰਦਾ ਹੈ।

---

## 4. ਹਫ਼ਤਾਵਾਰ ਪੇਆਊਟ ਸ਼ਡਿਊਲ
- **ਸੈਟਲਮੈਂਟ ਸਾਈਕਲ**: T+7 ਦਿਨ (ਡਿਲਿਵਰੀ ਤੋਂ 7 ਦਿਨ ਬਾਅਦ)।
- **ਪੇਆਊਟ ਦਿਨ**: ਹਰ ਵੀਰਵਾਰ।
- **ਆਟੋਮੇਸ਼ਨ**: Cashfree Auto-Payout API ਰਾਹੀਂ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ।
"""),

    "02_Financial_GST_TCS_Guide_Punjabi": ("Punjabi", """# FarmsKing Financial, Banking & GST TCS Compliance Guide
**ਵਿੱਤੀ ਨਿਯਮ, ਬੈਂਕਿੰਗ, ਟੈਕਸ ਅਤੇ GST TCS ਗਾਈਡ**

---

## 1. Banking Architecture / ਬੈਂਕਿੰਗ ਅਕਾਊਂਟ ਸੈੱਟਅੱਪ
ਈ-ਕੋਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਚਲਾਉਣ ਲਈ FarmsKing ਨੂੰ ਹੇਠ ਲਿਖੇ ਬੈਂਕ ਅਕਾਊਂਟ ਚਾਹੀਦੇ ਹਨ:

1. **ICICI Bank E-Commerce Nodal / Escrow Account**:
   - ਕਿਸਾਨਾਂ ਦਾ ਸਾਰਾ ਪੈਸਾ ਪਹਿਲਾਂ ਇਸ ਅਕਾਊਂਟ ਵਿੱਚ ਆਉਂਦਾ ਹੈ।
   - ਇਹ ਅਕਾਊਂਟ ਆਰ.ਬੀ.ਆਈ (RBI) ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਈ-ਕੋਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਲਈ ਹੁੰਦਾ ਹੈ।
2. **Cashfree Marketplace Split Gateway**:
   - ਪੇਮੈਂਟ ਮਿਲਦੇ ਹੀ FarmsKing ਦਾ 10% ਕਮਿਸ਼ਨ FarmsKing ਦੇ ਕਰੰਟ ਅਕਾਊਂਟ ਵਿੱਚ ਅਤੇ ਬਾਕੀ ਸੈਲਰ ਦੇ ਅਕਾਊਂਟ ਵਿੱਚ ਆਟੋਮੈਟਿਕ ਵੰਡਿਆ ਜਾਂਦਾ ਹੈ।

---

## 2. GST TCS (Tax Collected at Source) - 1% Rule
* **ਕਾਨੂਨੀ ਨਿਯਮ (Sec 52 of CGST Act)**: ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਲਈ ਹਰੇਕ ਸੈਲਰ ਦੀ ਵਿਕਰੀ 'ਤੇ 1% GST TCS (0.5% CGST + 0.5% SGST ਜਾਂ 1% IGST) ਕੱਟਣਾ ਲਾਜ਼ਮੀ ਹੈ।
* **ਉਦਾਹਰਨ**:
  - ਉਤਪਾਦ ਦੀ ਕੀਮਤ: ₹1,000
  - GST TCS (1%): ₹10 (ਇਹ ਪੈਸਾ FarmsKing ਸਰਕਾਰ ਕੋਲ ਜਮ੍ਹਾਂ ਕਰਵਾਏਗਾ)।
  - ਸੈਲਰ ਨੂੰ GST ਕ੍ਰੈਡਿਟ (ITC) ਮਿਲੇਗਾ, ਜਿਸ ਨਾਲ ਉਹ ਆਪਣੇ ਟੈਕਸ ਵਿੱਚੋਂ ਇਸਨੂੰ ਐਡਜਸਟ ਕਰ ਸਕਦਾ ਹੈ।

---

## 3. C.A. (Chartered Accountant) Reports & Filing
FarmsKing ਐਡਮਿਨ ਪੈਨਲ ਵਿੱਚ C.A. ਲਈ ਇੱਕ ਖਾਸ ਡੈਸ਼ਬੋਰਡ / ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਸੈਕਸ਼ਨ ਹੋਵੇਗਾ:
* **GSTR-8 Monthly Report**:
  - ਹਰ ਮਹੀਨੇ ਦੀ 10 ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ GSTR-8 ਫਾਈਲ ਕਰਨਾ ਹੁੰਦਾ ਹੈ।
  - Excel/CSV ਫਾਰਮੈਟ ਵਿੱਚ ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਹੋਵੇਗੀ ਜਿਸ ਵਿੱਚ: GSTIN, Total Sales, Returned Sales, Net Value, TCS Amount ਸ਼ਾਮਲ ਹੋਵੇਗਾ।

---

## 4. Weekly Payout Schedule / ਪੇਆਊਟ ਸਮਾਂ-ਸਾਰਣੀ
- **ਸੈਟਲਮੈਂਟ ਸਾਈਕਲ**: T+7 ਦਿਨ (ਆਰਡਰ ਡਿਲਿਵਰ ਹੋਣ ਤੋਂ 7 ਦਿਨ ਬਾਅਦ, ਤਾਂ ਜੋ ਰਿਟਰਨ ਵਿੰਡੋ ਪੂਰੀ ਹੋ ਸਕੇ)।
- **ਪੇਆਊਟ ਦਿਨ**: ਹਰ ਵੀਰਵਾਰ (Thursday)।
- **ਆਟੋਮੇਸ਼ਨ**: Cashfree Auto-Payout API ਰਾਹੀਂ ਸਿੱਧਾ ਸੈਲਰ ਦੇ ਬੈਂਕ ਅਕਾਊਂਟ ਵਿੱਚ।
"""),

    # 03 LOGISTICS
    "03_Logistics_Shipping_Operations_English": ("English", """# FarmsKing Logistics & Shipping Operations Guide
**Shipping, Courier Integration & Delivery Rules**

---

## 1. Overview
FarmsKing utilizes the **Shiprocket API** infrastructure to handle pan-India logistics, linking with major carriers (Delhivery, BlueDart, Ekart, DTDC) for multi-vendor pickup and doorstep delivery.

---

## 2. 3 Flexible Delivery Modes
1. **FarmsKing Courier (Shiprocket)**: Fully automated pickup from seller store and delivery to farmer.
2. **Seller Self-Delivery**: Designed for heavy equipment, machinery, or local tractor delivery.
3. **Local Store Pickup**: Farmers collect directly from the vendor's physical store with zero shipping cost.

---

## 3. The 50-50 Free Delivery Profit Split Rule
When a seller chooses to offer **Free Delivery** on an item, shipping fees are split **50-50%** between FarmsKing and the Seller.

### Formula:
- **FarmsKing Earning** = Commission (10%) - (Shipping Fee / 2)
- **Seller Payout** = Price - Commission (10%) - (Shipping Fee / 2) - GST TCS (1%)

### Example Breakdown (₹2000 Product, ₹400 Shipping Fee):
- Product Price: ₹2,000
- 10% FarmsKing Commission: ₹200
- Actual Shipping Fee: ₹400
- FarmsKing 50% Share of Shipping: ₹200
- Seller 50% Share of Shipping: ₹200
- **FarmsKing Final Earning**: ₹200 - ₹200 = **₹0** (FarmsKing covers its share via commission; zero out-of-pocket loss!).
- **Seller Final Payout**: ₹2000 - ₹200 - ₹200 = **₹1,600** (- 1% TCS).

---

## 4. Seller App Product Addition Interface
When sellers list products, the app dynamically displays:
1. **Volumetric Weight Calculator**: Auto-calculates shipping fee using dimensions (L x W x H) and weight.
2. **Shipping Choice**: Standard Customer Paid Delivery vs Free Delivery (50-50 split rule applied).
"""),

    "03_Logistics_Shipping_Operations_Hindi": ("Hindi", """# ਫਾਰਮਸਕਿੰਗ ਲੌਜਿਸਟਿਕਸ ਅਤੇ ਸ਼ਿਪਿੰਗ ਆਪ੍ਰੇਸ਼ਨਜ਼ ਗਾਈਡ
**ਸ਼ਿਪਿੰਗ, ਕੂਰੀਅਰ ਏਪੀਆਈ ਅਤੇ ਡਿਲਿਵਰੀ ਨਿਯਮ**

---

## 1. ਲੌਜਿਸਟਿਕਸ ਢਾਂਚਾ
ਫਾਰਮਸਕਿੰਗ **Shiprocket API** ਦੀ ਵਰਤੋਂ ਕਰਦਾ ਹੈ ਜੋ ਭਾਰਤ ਦੇ ਪ੍ਰਮੁੱਖ ਕੂਰੀਅਰ ਪਾਰਟਨਰਾਂ (Delhivery, BlueDart, Ekart) ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ ਹੈ।

---

## 2. ਡਿਲਿਵਰੀ ਦੇ 3 ਤਰੀਕੇ
1. **FarmsKing Courier (Shiprocket)**: ਆਟੋਮੈਟਿਕ ਦੁਕਾਨ ਤੋਂ ਪਿਕਅੱਪ ਅਤੇ ਕਿਸਾਨ ਤੱਕ ਡਿਲਿਵਰੀ।
2. **Seller Self-Delivery**: ਭਾਰੀ ਮਸ਼ੀਨਰੀ ਜਾਂ ਨੇੜਲੇ ਇਲਾਕਿਆਂ ਲਈ ਸੈਲਰ ਆਪ ਡਿਲਿਵਰ ਕਰਦਾ ਹੈ।
3. **Local Store Pickup**: ਕਿਸਾਨ ਆਪ ਦੁਕਾਨ ਤੋਂ ਸਮਾਨ ਚੱਕ ਸਕਦਾ ਹੈ (ਜ਼ੀਰੋ ਡਿਲਿਵਰੀ ਚਾਰਜ)।

---

## 3. 50-50% ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਨਿਯਮ
ਜਦੋਂ ਸੈਲਰ ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ (Free Shipping) ਚੁਣਦਾ ਹੈ, ਤਾਂ ਸ਼ਿਪਿੰਗ ਖਰਚਾ **ਫਾਰਮਸਕਿੰਗ** ਅਤੇ **ਸੈਲਰ** ਅੱਧਾ-ਅੱਧਾ (50%-50%) ਚੁੱਕਣਗੇ।

### ਉਦਾਹਰਨ (₹2000 ਪ੍ਰੋਡਕਟ, ₹400 ਡਿਲਿਵਰੀ ਖਰਚਾ):
- ਪ੍ਰੋਡਕਟ ਕੀਮਤ: ₹2,000
- ਫਾਰਮਸਕਿੰਗ 10% ਕਮਿਸ਼ਨ: ₹200
- ਕੂਰੀਅਰ ਖਰਚਾ: ₹400
- ਫਾਰਮਸਕਿੰਗ ਡਿਲਿਵਰੀ ਹਿੱਸਾ: ₹200
- ਸੈਲਰ ਡਿਲਿਵਰੀ ਹਿੱਸਾ: ₹200
- **ਫਾਰਮਸਕਿੰਗ ਨੈੱਟ ਕਮਾਈ**: ₹200 - ₹200 = **₹0** (ਕਮਿਸ਼ਨ ਨਾਲ ਸ਼ਿਪਿੰਗ ਖਰਚਾ ਪੂਰਾ, ਜੇਬ੍ਹ 'ਚੋਂ ਜ਼ੀਰੋ)।
- **ਸੈਲਰ ਪੇਆਊਟ**: ₹2000 - ₹200 - ₹200 = **₹1,600** (- 1% GST TCS)।
"""),

    "03_Logistics_Shipping_Operations_Punjabi": ("Punjabi", """# FarmsKing Logistics & Shipping Operations Guide
**ਸ਼ਿਪਿੰਗ, ਡਿਲਿਵਰੀ ਅਤੇ ਲੌਜਿਸਟਿਕਸ ਆਪ੍ਰੇਸ਼ਨਜ਼ ਗਾਈਡ**

---

## 1. Overview / ਲੌਜਿਸਟਿਕਸ ਦਾ ਢਾਂਚਾ
FarmsKing ਪਲੇਟਫਾਰਮ 'ਤੇ ਸਮਾਨ ਦੀ ਆਵਾਜਾਈ ਲਈ **Shiprocket API** ਦੀ ਵਰਤੋਂ ਕੀਤੀ ਜਾਂਦੀ ਹੈ, ਜੋ ਭਾਰਤ ਦੇ ਪ੍ਰਮੁੱਖ ਕੂਰੀਅਰ ਪਾਰਟਨਰਾਂ (Delhivery, BlueDart, DTDC, Ekart) ਨਾਲ ਸਿੱਧਾ ਜੁੜੀ ਹੋਈ ਹੈ।

---

## 2. 3 Delivery Modes / ਡਿਲਿਵਰੀ ਦੇ 3 ਤਰੀਕੇ
1. **FarmsKing Courier (Shiprocket Partner)**:
   - ਆਟੋਮੈਟਿਕ ਪਿਕਅੱਪ ਅਤੇ ਡਿਲਿਵਰੀ।
   - ਆਰਡਰ ਆਉਂਦੇ ਹੀ Shiprocket ਰਾਹੀਂ ਲੇਬਲ ਅਤੇ ਮੈਨੀਫੈਸਟ ਜਨਰੇਟ ਹੁੰਦਾ ਹੈ।
2. **Seller Self-Delivery**:
   - ਭਾਰੀ ਮਸ਼ੀਨਰੀ ਜਾਂ ਨੇੜਲੇ ਇਲਾਕਿਆਂ ਵਿੱਚ ਸੈਲਰ ਆਪ ਆਪਣੀ ਗੱਡੀ 'ਤੇ ਡਿਲਿਵਰੀ ਕਰਦਾ ਹੈ।
   - ਸੈਲਰ ਨੂੰ ਐਪ ਵਿੱਚ Tracking ID ਅਤੇ Courier Name ਦਰਜ ਕਰਨਾ ਪੈਂਦਾ ਹੈ।
3. **Local Store Pickup**:
   - ਕਿਸਾਨ ਆਪ ਸੈਲਰ ਦੀ ਦੁਕਾਨ 'ਤੇ ਜਾ ਕੇ ਸਮਾਨ ਚੱਕ ਸਕਦਾ ਹੈ (No Shipping Charge)।

---

## 3. The Free Delivery 50-50 Profit Split Rule / 50-50% ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਨਿਯਮ
ਜਦੋਂ ਸੈਲਰ ਕਿਸੇ ਪ੍ਰੋਡਕਟ 'ਤੇ ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ (Free Shipping) ਦਿੰਦਾ ਹੈ, ਤਾਂ ਉਸ ਦਾ ਖਰਚਾ **FarmsKing** ਅਤੇ **Seller** ਅੱਧਾ-ਅੱਧਾ (50%-50%) ਚੁੱਕਣਗੇ।

### Profit & Cost Calculation Formula / ਹਿਸਾਬ-ਕਿਤਾਬ:
- **Product Price**: \( P \)
- **FarmsKing Commission (10%)**: \( C = 0.10 \times P \)
- **Actual Shipping Fee**: \( S \)
- **FarmsKing Share**: \( \frac{S}{2} \)
- **Seller Share**: \( \frac{S}{2} \)
- **FarmsKing Net Earnings**: \( C - \frac{S}{2} \)
- **Seller Net Payout**: \( P - C - \frac{S}{2} - \text{TCS} \)

### Real Case Example:
- **Product Price**: ₹2,000
- **FarmsKing Margin (10%)**: ₹200
- **Actual Shipping Charge**: ₹400 (ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਦਿੱਤੀ)
- **FarmsKing Share of Shipping**: ₹200
- **Seller Share of Shipping**: ₹200
- **FarmsKing Final Earning**: \( 200 - 200 = ₹0 \)
- **Seller Final Payout**: \( 2000 - 200 - 200 = ₹1600 \) (- 1% GST TCS).
- **ਸਿੱਟਾ**: FarmsKing ਆਪਣੀ ਜੇਬ੍ਹ ਵਿੱਚੋਂ ₹50 ਨਹੀਂ ਦੇਵੇਗਾ, ਬਲਕਿ 10% ਕਮਿਸ਼ਨ (₹200) ਨਾਲ ਆਪਣੇ ਹਿੱਸੇ ਦਾ shipping ਖਰਚਾ (₹200) ਪੂਰਾ ਹੋ ਜਾਵੇਗਾ!

---

## 4. Seller Product Addition Guidance / ਪ੍ਰੋਡਕਟ ਐਡ ਕਰਦੇ ਸਮੇਂ ਸ਼ਿਪਿੰਗ ਜਾਣਕਾਰੀ
ਪ੍ਰੋਡਕਟ ਐਡ ਕਰਦੇ ਸਮੇਂ ਸੈਲਰ ਨੂੰ ਐਪ ਵਿੱਚ ਹੇਠ ਲਿਖੀਆਂ ਚੀਜ਼ਾਂ ਦਿੱਖਣਗੀਆਂ:
1. **Volumetric Weight Calculator**: ਲੰਬਾਈ, ਚੌੜਾਈ, ਉਚਾਈ ਅਤੇ ਭਾਰ ਦਰਜ ਕਰਦੇ ਹੀ Shiprocket API ਅਨੁਮਾਨਿਤ ਡਿਲਿਵਰੀ ਖਰਚਾ ਦੱਸੇਗੀ।
2. **Shipping Option Choice**:
   - Option A: Standard Shipping Charges (ਕਿਸਾਨ ਡਿਲਿਵਰੀ ਖਰਚਾ ਦੇਵੇਗਾ)।
   - Option B: Free Delivery (50-50 Split Rule ਲਾਗੂ ਹੋਵੇਗਾ)।
"""),

    # 04 DISPUTES
    "04_Dispute_Resolution_and_Risk_Guide_English": ("English", """# FarmsKing E-Commerce Dispute Resolution & Risk Guide
**Dispute Mechanisms, Return Policies & Risk Prevention**

---

## 1. Top 5 E-Commerce Disputes & Automated Resolutions

### Dispute 1: Fake, Expired, or Damaged Products
* **Resolution**: Unboxing video mandatory for buyers upon delivery. Seller payout blocked in Escrow. Seller must dispatch replacement within 48h or 100% refund triggered. 2 consecutive violations result in seller ban.

### Dispute 2: Incorrect Item Delivered
* **Resolution**: Shiprocket Automated Reverse Pickup initiated. Return shipping cost billed directly to seller.

### Dispute 3: Shipping Delay
* **Resolution**: Real-time tracking via Shiprocket. Orders delayed > 7 days enable 100% buyer cancellation & refund option.

### Dispute 4: Customer Refused Delivery (RTO)
* **Resolution**: Admin confirmation call on COD orders prior to dispatch. Return courier fee deducted from seller account balance.

### Dispute 5: Payment Deducted but Order Pending
* **Resolution**: Handled via Cashfree Webhooks. Auto-reconciled or refunded within 24 hours.

---

## 2. Risk Mitigation Protocols
1. **KYC Lock**: Sellers cannot list items without verified GSTIN, PAN, and Bank Account.
2. **Escrow Hold**: Funds held for 7 days post-delivery to secure return windows.
"""),

    "04_Dispute_Resolution_and_Risk_Guide_Hindi": ("Hindi", """# ਫਾਰਮਸਕਿੰਗ ਈ-ਕੋਮਰਸ ਝਗੜੇ ਅਤੇ ਜੋਖਮ ਪ੍ਰਬੰਧਨ ਗਾਈਡ
**ਝਗੜੇ, ਵਾਪਸੀ ਨੀਤੀਆਂ ਅਤੇ ਸੁਰੱਖਿਆ ਨਿਯਮ**

---

## 1. 5 ਮੁੱਖ ਝਗੜੇ ਅਤੇ ਹੱਲ

### 1. ਨਕਲੀ ਜਾਂ ਖਰਾਬ ਸਮਾਨ:
* ਅਨਬਾਕਸਿੰਗ ਵੀਡੀਓ ਲਾਜ਼ਮੀ। ਸੈਲਰ ਦਾ ਪੇਆਊਟ ਰੋਕਿਆ ਜਾਵੇਗਾ। 48 ਘੰਟਿਆਂ 'ਚ ਨਵਾਂ ਸਮਾਨ ਜਾਂ 100% ਰਿਫੰਡ। 2 ਸ਼ਿਕਾਇਤਾਂ 'ਤੇ ਸੈਲਰ ਬਲੈਕਲਿਸਟ।

### 2. ਗਲਤ ਸਮਾਨ ਮਿਲਣਾ:
* Shiprocket ਰਿਵਰਸ ਪਿਕਅੱਪ। ਸ਼ਿਪਿੰਗ ਖਰਚਾ ਸੈਲਰ ਦੇ ਖਾਤੇ 'ਚੋਂ ਕੱਟਿਆ ਜਾਵੇਗਾ।

### 3. ਡਿਲਿਵਰੀ 'ਚ ਦੇਰੀ:
* ਐਪ 'ਚ ਲਾਈਵ ਟਰੈਕਿੰਗ। 7 ਦਿਨਾਂ ਤੋਂ ਵੱਧ ਦੇਰੀ 'ਤੇ 100% ਰਿਫੰਡ।

### 4. ਕਿਸਾਨ ਦੁਆਰਾ ਆਰਡਰ ਰੱਦ ਕਰਨਾ (RTO):
* ਡਿਲਿਵਰੀ ਤੋਂ ਪਹਿਲਾਂ ਕਨਫਰਮੇਸ਼ਨ ਕਾਲ। ਵਾਪਸੀ ਖਰਚਾ ਸੈਲਰ ਦਾ ਹੋਵੇਗਾ।

### 5. ਪੈਸੇ ਕੱਟੇ ਪਰ ਆਰਡਰ ਨਾ ਹੋਇਆ:
* Cashfree API ਰਾਹੀਂ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਆਟੋ-ਰਿਫੰਡ।
"""),

    "04_Dispute_Resolution_and_Risk_Guide_Punjabi": ("Punjabi", """# FarmsKing E-Commerce Dispute Resolution & Risk Guide
**ਈ-ਕੋਮਰਸ ਝਗੜੇ, ਸਮੱਸਿਆਵਾਂ ਅਤੇ ਜੋਖਮ ਪ੍ਰਬੰਧਨ ਗਾਈਡ**

---

## 1. Top 5 E-Commerce Disputes & Automated Solutions / 5 ਮੁੱਖ ਝਗੜੇ ਅਤੇ ਹੱਲ

### Dispute 1: ਨਕਲੀ ਜਾਂ ਖਰਾਬ ਸਮਾਨ (Fake or Expired / Damaged Product)
* **ਸਮੱਸਿਆ**: ਕਿਸਾਨ ਨੇ ਬੀਜ ਜਾਂ ਦਵਾਈ ਮੰਗਵਾਈ ਜੋ ਨਕਲੀ ਸੀ ਜਾਂ ਐਕਸਪਾਇਰ ਸੀ।
* **ਹੱਲ**: 
  - ਖਰੀਦਦਾਰ ਲਈ ਡਿਲਿਵਰੀ ਵੇਲੇ **Unboxing Video** ਬਣਾਉਣਾ ਲਾਜ਼ਮੀ ਹੋਵੇਗਾ।
  - FarmsKing ਸੈਲਰ ਦਾ ਪੇਆਊਟ ਰੋਕ ਲਵੇਗਾ।
  - ਸੈਲਰ ਨੂੰ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਬਦਲ ਕੇ ਨਵਾਂ ਸਮਾਨ ਭੇਜਣਾ ਪਵੇਗਾ ਜਾਂ ਕਿਸਾਨ ਨੂੰ 100% ਰਿਫੰਡ ਦਿੱਤਾ ਜਾਵੇਗਾ।
  - ਲਗਾਤਾਰ 2 ਸ਼ਿਕਾਇਤਾਂ 'ਤੇ ਸੈਲਰ ਬਲੈਕਲਿਸਟ ਹੋ ਜਾਵੇਗਾ।

---

### Dispute 2: ਗਲਤ ਸਾਈਜ਼ ਜਾਂ ਗਲਤ ਟੂਲ (Wrong Item Delivered)
* **ਸਮੱਸਿਆ**: ਆਰਡਰ ਕੀਤਾ ਸੀ ਟੂਲ A, ਮਿਲਿਆ ਟੂਲ B।
* **ਹੱਲ**: 
  - Shiprocket ਰਿਵਰਸ ਪਿਕਅੱਪ (Reverse Pickup) ਸਿਸਟਮ ਚੱਲੇਗਾ।
  - ਰਿਵਰਸ ਸ਼ਿਪਿੰਗ ਦਾ ਸਾਰਾ ਖਰਚਾ ਸੈਲਰ ਦੇ ਅਕਾਊਂਟ ਵਿੱਚੋਂ ਕੱਟਿਆ ਜਾਵੇਗਾ।

---

### Dispute 3: ਡਿਲਿਵਰੀ ਵਿੱਚ ਦੇਰੀ (Delayed Delivery)
* **ਸਮੱਸਿਆ**: ਕੂਰੀਅਰ ਕੰਪਨੀ ਨੇ 5 ਦਿਨਾਂ ਦੀ ਥਾਂ 12 ਦਿਨ ਲਗਾ ਦਿੱਤੇ।
* **ਹੱਲ**: 
  - ਐਪ ਵਿੱਚ **Live Shiprocket Tracking**।
  - 7 ਦਿਨਾਂ ਤੋਂ ਵੱਧ ਦੇਰੀ ਹੋਣ 'ਤੇ ਕਿਸਾਨ ਆਰਡਰ ਕੈਂਸਲ ਕਰ ਸਕਦਾ ਹੈ ਅਤੇ 100% ਰਿਫੰਡ ਪਾ ਸਕਦਾ ਹੈ।

---

### Dispute 4: ਕਿਸਾਨ ਨੇ ਡਿਲਿਵਰੀ ਲੈਣ ਤੋਂ ਨਾਂਹ ਕਰ ਦਿੱਤੀ (RTO - Return to Origin)
* **ਸਮੱਸਿਆ**: ਕੂਰੀਅਰ ਦੁਕਾਨ 'ਤੇ ਪਹੁੰਚਿਆ ਪਰ ਕਿਸਾਨ ਨੇ ਆਰਡਰ ਲੈਣ ਤੋਂ ਮਨ੍ਹਾ ਕਰ ਦਿੱਤਾ।
* **ਹੱਲ**: 
  - COD (Cash on Delivery) ਵਾਲੇ ਆਰਡਰਾਂ 'ਤੇ ਪਹਿਲਾਂ ਹੀ FarmsKing ਐਡਮਿਨ ਆਰਡਰ ਕਨਫਰਮੇਸ਼ਨ ਕਾਲ ਕਰੇਗਾ।
  - ਆਰ.ਟੀ.ਓ (RTO) ਦੇ ਕੇਸ ਵਿੱਚ ਵਾਪਸੀ ਦਾ ਕੂਰੀਅਰ ਖਰਚਾ ਸੈਲਰ ਚੁੱਕੇਗਾ।

---

### Dispute 5: ਪੇਮੈਂਟ ਕੱਟੀ ਗਈ ਪਰ ਆਰਡਰ ਨਾ ਹੋਇਆ (Payment Deducted but Order Failed)
* **ਸਮੱਸਿਆ**: ਕਿਸਾਨ ਦੇ ਬੈਂਕ ਵਿੱਚੋਂ ਪੈਸੇ ਕੱਟ ਗਏ ਪਰ ਐਪ 'ਚ ਆਰਡਰ ਪੈਂਡਿੰਗ ਦਿਖਾ ਰਿਹਾ ਹੈ।
* **ਹੱਲ**: 
  - Cashfree Webhook API ਆਟੋ-ਰਿਸਪੌਂਡ ਕਰੇਗੀ। 24 ਘੰਟਿਆਂ ਵਿੱਚ ਪੈਸੇ ਕਿਸਾਨ ਦੇ ਅਕਾਊਂਟ ਵਿੱਚ ਵਾਪਸ ਆ ਜਾਣਗੇ।

---

## 2. Risk Mitigation Protocols / ਜੋਖਮ ਤੋਂ ਬਚਾਅ
1. **Mandatory KYC Verification**: ਬਿਨਾਂ GSTIN, PAN Card, ਅਤੇ ਬੈਂਕ ਵੈਰੀਫਿਕੇਸ਼ਨ ਤੋਂ ਸੈਲਰ ਐਕਟਿਵ ਨਹੀਂ ਹੋਵੇਗਾ।
2. **Escrow Holding Window**: ਪੈਸੇ 7 ਦਿਨਾਂ ਤੱਕ FarmsKing ਨੋਡਲ ਅਕਾਊਂਟ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੇ ਹਨ, ਤਾਂ ਜੋ ਝਗੜੇ ਵੇਲੇ ਕਿਸਾਨ ਦੇ ਪੈਸੇ ਸੁਰੱਖਿਅਤ ਰਹਿਣ।
"""),

    # 05 COMMUNICATION SCRIPTS
    "05_Communication_Scripts_and_Talking_Points_English": ("English", """# FarmsKing Party Communication & Talking Points Guide
**Official Dialogue Scripts for Bank, C.A., Sellers, Payment Gateway & Courier**

---

## 1. Script for ICICI Bank (Nodal Account)
* **Topic**: Opening E-Commerce Nodal Escrow Account for Marketplace Aggregator.
* **Talking Points**:
  - "FarmsKing operates an agri-marketplace connecting local dealers with farmers."
  - "We require an E-Commerce Nodal Account under RBI guidelines."
  - "We integrate Cashfree Split APIs for automated seller payouts."

---

## 2. Script for Chartered Accountant (CA)
* **Topic**: GST TCS Sec 52 Compliance & Monthly GSTR-8 Filing.
* **Talking Points**:
  - "FarmsKing acts as an E-Commerce Operator."
  - "We deduct 1% GST TCS (0.5% CGST + 0.5% SGST) on net sales."
  - "The system exports monthly CSVs for GSTR-8 return filing before the 10th."

---

## 3. Script for Seller Onboarding
* **Topic**: Registering local agri-dealers on FarmsKing.
* **Talking Points**:
  - "Welcome to FarmsKing! Reach thousands of local farmers digitally."
  - **Commission**: 10% platform fee per sale.
  - **Logistics**: Shiprocket picks up directly from your store.
  - **Payout**: Deposited every Thursday directly to your bank account.
"""),

    "05_Communication_Scripts_and_Talking_Points_Hindi": ("Hindi", """# ਫਾਰਮਸਕਿੰਗ ਗੱਲਬਾਤ ਅਤੇ ਸਕ੍ਰਿਪਟ ਗਾਈਡ
**ਬੈਂਕ, CA, ਸੈਲਰਾਂ ਅਤੇ ਲੌਜਿਸਟਿਕਸ ਨਾਲ ਗੱਲਬਾਤ ਦੀਆਂ ਸਕ੍ਰਿਪਟਾਂ**

---

## 1. ICICI Bank ਨਾਲ ਗੱਲਬਾਤ (Nodal Account)
- "ਸਾਡਾ ਪਲੇਟਫਾਰਮ FarmsKing ਖੇਤੀਬਾੜੀ ਮਾਰਕੀਟਪਲੇਸ ਹੈ। ਸਾਨੂੰ RBI ਹਦਾਇਤਾਂ ਮੁਤਾਬਕ ਈ-ਕੋਮਰਸ ਨੋਡਲ ਅਕਾਊਂਟ ਚਾਹੀਦਾ ਹੈ।"

## 2. Chartered Accountant (CA) ਨਾਲ ਗੱਲਬਾਤ
- "FarmsKing ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਵਜੋਂ 1% GST TCS ਕੱਟ ਕੇ ਜਮ੍ਹਾਂ ਕਰਵਾਏਗਾ। ਹਰ ਮਹੀਨੇ GSTR-8 ਲਈ ਐਕਸਲ ਰਿਪੋਰਟ ਮਿਲੇਗੀ।"

## 3. ਸੈਲਰਾਂ (ਦੁਕਾਨਦਾਰਾਂ) ਨਾਲ ਗੱਲਬਾਤ
- "FarmsKing ਨਾਲ ਜੁੜ ਕੇ ਆਪਣੇ ਇਲਾਕੇ ਦੇ ਕਿਸਾਨਾਂ ਨੂੰ ਆਨਲਾਈਨ ਸਮਾਨ ਵੇਚੋ। 10% ਕਮਿਸ਼ਨ, ਹਰ ਵੀਰਵਾਰ ਬੈਂਕ ਵਿੱਚ ਪੇਆਊਟ।"
"""),

    "05_Communication_Scripts_and_Talking_Points_Punjabi": ("Punjabi", """# FarmsKing Party Communication & Talking Points Guide
**ਵਿਭਿੰਨ ਧਿਰਾਂ ਨਾਲ ਗੱਲਬਾਤ ਕਰਨ ਦੇ ਤਰੀਕੇ ਅਤੇ ਸਕ੍ਰਿਪਟਾਂ**

---

## 1. Script for ICICI Bank (E-Commerce Nodal Account)
* **ਗੱਲਬਾਤ ਦਾ ਵਿਸ਼ਾ**: E-Commerce Nodal / Escrow Account opening for Marketplace Aggregator.
* **Talking Points**:
  - "ਸਾਡਾ ਪਲੇਟਫਾਰਮ FarmsKing ਖੇਤੀਬਾੜੀ ਮਾਰਕੀਟਪਲੇਸ ਹੈ ਜਿੱਥੇ ਵੱਖ-ਵੱਖ ਸੈਲਰ ਕਿਸਾਨਾਂ ਨੂੰ ਸਮਾਨ ਵੇਚਦੇ ਹਨ।"
  - "ਸਾਨੂੰ RBI ਦੀਆਂ ਹਦਾਇਤਾਂ ਮੁਤਾਬਕ ਈ-ਕੋਮਰਸ ਨੋਡਲ ਅਕਾਊਂਟ (Nodal Escrow Account) ਚਾਹੀਦਾ ਹੈ।"
  - "ਸਾਡੇ ਕੋਲ Cashfree Payment Gateway ਦੀ ਮਾਰਕੀਟਪਲੇਸ ਸਪਲਿਟ API ਚਲਦੀ ਹੈ, ਜੋ ਆਟੋਮੈਟਿਕ T+7 ਸੈਟਲਮੈਂਟ ਰਾਹੀਂ ਸੈਲਰਾਂ ਨੂੰ ਪੇਆਊਟ ਕਰੇਗੀ।"

---

## 2. Script for Chartered Accountant (CA)
* **ਗੱਲਬਾਤ ਦਾ ਵਿਸ਼ਾ**: GST TCS (Sec 52) Compliance & Monthly GSTR-8 Filing.
* **Talking Points**:
  - "FarmsKing ਇੱਕ ਈ-ਕੋਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਦੇ ਤੌਰ 'ਤੇ ਕੰਮ ਕਰ ਰਿਹਾ ਹੈ।"
  - "ਅਸੀਂ ਸਾਰੇ ਸੈਲਰਾਂ ਦੀ ਨੈੱਟ ਵਿਕਰੀ ਵਿੱਚੋਂ 1% GST TCS (CGST 0.5% + SGST 0.5% / IGST 1%) ਕੱਟ ਕੇ ਸਰਕਾਰ ਕੋਲ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣਾ ਹੈ।"
  - "ਸਾਡਾ ਸਿਸਟਮ ਹਰ ਮਹੀਨੇ ਦੀ 1 ਤੋਂ 5 ਤਰੀਕ ਤੱਕ ਐਕਸਲ/CSV ਰਿਪੋਰਟ ਜਨਰੇਟ ਕਰੇਗਾ। CA ਹਰ ਮਹੀਨੇ ਦੀ 10 ਤਰੀਕ ਤੱਕ GSTR-8 ਰਿਟਰਨ ਫਾਈਲ ਕਰੇਗਾ।"

---

## 3. Script for Onboarding New Sellers (ਵਪਾਰੀਆਂ ਨਾਲ ਗੱਲਬਾਤ)
* **ਗੱਲਬਾਤ ਦਾ ਵਿਸ਼ਾ**: FarmsKing 'ਤੇ ਆਪਣੀ ਦੁਕਾਨ ਲਿਸਟ ਕਰਨਾ।
* **Talking Points**:
  - "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, FarmsKing ਐਪ ਰਾਹੀਂ ਤੁਹਾਡੀ ਦੁਕਾਨ ਪੂਰੇ ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੇ ਕਿਸਾਨਾਂ ਨਾਲ ਸਿੱਧੀ ਜੁੜ ਜਾਵੇਗੀ।"
  - **ਕਮਿਸ਼ਨ**: FarmsKing 10% ਪਲੇਟਫਾਰਮ ਫੀਸ ਲੈਂਦਾ ਹੈ।
  - **ਡਿਲਿਵਰੀ**: FarmsKing ਦਾ ਕੂਰੀਅਰ ਆਪ ਤੁਹਾਡੀ ਦੁਕਾਨ ਤੋਂ ਸਮਾਨ ਚੱਕ ਕੇ ਕਿਸਾਨ ਤੱਕ ਪਹੁੰਚਾਏਗਾ।
  - **ਪੇਆਊਟ**: ਹਰ ਵੀਰਵਾਰ ਪੈਸੇ ਸਿੱਧੇ ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਆਉਣਗੇ।
"""),

    # 06 SELLER TERMS
    "06_Seller_Terms_and_Agreement_English": ("English", """# FarmsKing Seller Agreement & Terms of Service
**Merchant Onboarding Rules, Requirements & SLA**

---

## 1. Mandatory KYC Documents
1. **GSTIN (GST Certificate)**
2. **PAN Card (Proprietorship / Business)**
3. **Cancelled Cheque / Bank Account Details**
4. **Valid Agriculture License (For Seeds/Fertilizers/Chemicals)**

---

## 2. Onboarding Workflow Steps
1. **Registration**: Seller submits basic profile on app.
2. **Document Upload**: GSTIN, PAN, and License photos uploaded.
3. **Admin Verification**: FarmsKing team verifies credentials within 24-48h.
4. **Store Activation**: Store goes live for product catalog upload.

---

## 3. Financial Terms
- **Platform Fee**: 10% deducted on each completed sale.
- **GST TCS**: 1% withheld and deposited to Govt.
- **Weekly Settlement**: Payouts executed every Thursday via Cashfree API.
"""),

    "06_Seller_Terms_and_Agreement_Hindi": ("Hindi", """# ਫਾਰਮਸਕਿੰਗ ਸੈਲਰ ਸਮਝੌਤਾ ਅਤੇ ਸ਼ਰਤਾਂ
**ਦੁਕਾਨਦਾਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਤੇ ਸ਼ਰਤਾਂ**

---

## 1. ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼
1. GSTIN (GST ਸਰਟੀਫਿਕੇਟ)
2. PAN Card
3. ਬੈਂਕ ਖਾਤਾ / Cancelled Cheque
4. ਖੇਤੀਬਾੜੀ ਲਾਇਸੈਂਸ (ਬੀਜ/ਦਵਾਈਆਂ ਲਈ)

---

## 2. ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਦੇ 4 ਕਦਮ
1. ਐਪ 'ਚ ਰਜਿਸਟ੍ਰੇਸ਼ਨ
2. ਦਸਤਾਵੇਜ਼ ਅੱਪਲੋਡ
3. ਐਡਮਿਨ ਵੈਰੀਫਿਕੇਸ਼ਨ (24-48 ਘੰਟੇ)
4. ਸਟੋਰ ਚਾਲੂ (ਉਤਪਾਦ ਲਿਸਟਿੰਗ)
"""),

    "06_Seller_Terms_and_Agreement_Punjabi": ("Punjabi", """# FarmsKing Seller Agreement & Terms of Service
**ਸੈਲਰ ਸਮਝੌਤਾ ਅਤੇ ਵਰਤੋਂ ਦੀਆਂ ਸ਼ਰਤਾਂ**

---

## 1. Eligibility & Document Requirements / ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼
FarmsKing ਪਲੇਟਫਾਰਮ 'ਤੇ ਵਪਾਰੀ/ਸੈਲਰ ਬਣਨ ਲਈ ਹੇਠ ਲਿਖੇ ਦਸਤਾਵੇਜ਼ ਲਾਜ਼ਮੀ ਹਨ:
1. **GSTIN (GST Certificate)**
2. **PAN Card (Business / Proprietor)**
3. **Cancelled Cheque / Bank Account Details**
4. **Agri License (ਖਾਦ/ਬੀਜ/ਦਵਾਈਆਂ ਲਈ ਲਾਇਸੈਂਸ)**
5. **Shop / Warehouse Address Proof**

---

## 2. Onboarding Workflow / ਐਪ 'ਚ ਸ਼ਾਮਲ ਹੋਣ ਦੇ ਕਦਮ
1. **Step 1: Seller Registration**: ਐਪ ਰਾਹੀਂ ਸੈਲਰ ਆਪਣਾ ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ ਮੂਲ ਜਾਣਕਾਰੀ ਦਰਜ ਕਰਦਾ ਹੈ।
2. **Step 2: Document Upload**: GST, PAN, ਬੈਂਕ ਡਿਟੇਲਜ਼ ਅਤੇ ਲਾਇਸੈਂਸ ਦੀ ਫੋਟੋ ਅੱਪਲੋਡ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।
3. **Step 3: Verification**: FarmsKing ਐਡਮਿਨ 24-48 ਘੰਟਿਆਂ ਵਿੱਚ ਦਸਤਾਵੇਜ਼ ਵੈਰੀਫਾਈ ਕਰਦਾ ਹੈ।
4. **Step 4: Store Activation**: ਵੈਰੀਫਾਈ ਹੋਣ ਤੋਂ ਬਾਅਦ ਸੈਲਰ ਉਤਪਾਦ ਅੱਪਲੋਡ ਕਰਨ ਦੇ ਯੋਗ ਹੋ ਜਾਂਦਾ ਹੈ।

---

## 3. Financial Agreement & Deductions / ਫੀਸਾਂ ਅਤੇ ਕਟੌਤੀਆਂ
- **Platform Fee**: ਹਰੇਕ ਸਫਲ ਵਿਕਰੀ 'ਤੇ FarmsKing 10% ਫੀਸ ਕੱਟੇਗਾ।
- **GST TCS**: ਸਰਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ 1% TCS ਕੱਟ ਕੇ ਸੈਲਰ ਦੇ GSTIN ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਕਰਵਾਇਆ ਜਾਵੇਗਾ।
- **Payout Settlement**: ਹਰ ਵੀਰਵਾਰ ਨੂੰ T+7 ਦਿਨਾਂ ਦੇ ਆਧਾਰ 'ਤੇ ਪੇਆਊਟ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਟ੍ਰਾਂਸਫਰ ਹੋਵੇਗਾ।
"""),

    # 07 DEVELOPER BLUEPRINT
    "07_Developer_Execution_Blueprint_English": ("English", """# FarmsKing E-Commerce Developer Execution Blueprint
**Technical Architecture, Database Schemas & API Specifications**

---

## 1. Tech Stack Overview
- **Backend Framework**: NestJS (Node.js) with TypeScript
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Frontend App**: Expo React Native (Cross-Platform Mobile & Web)
- **Payment Gateway**: Cashfree Marketplace Split Payout SDK
- **Logistics Integration**: Shiprocket REST API

---

## 2. Database Schema (Prisma Snippet)
```prisma
model SellerStore {
  id             String        @id @default(uuid())
  businessName   String
  gstin          String        @unique
  panNumber      String
  bankAccountNo  String
  ifscCode       String
  isVerified     Boolean       @default(false)
  products       Product[]
  payouts        SellerPayout[]
  createdAt      DateTime      @default(now())
}

model SellerPayout {
  id             String      @id @default(uuid())
  storeId        String
  store          SellerStore @relation(fields: [storeId], references: [id])
  grossAmount    Float
  platformFee    Float       // 10%
  gstTcsAmount   Float       // 1%
  shippingDeduction Float    // 50% share if Free Delivery
  netPayout      Float
  status         String      // PENDING, PAID, HELD
  createdAt      DateTime    @default(now())
}
```
"""),

    "07_Developer_Execution_Blueprint_Hindi": ("Hindi", """# ਫਾਰਮਸਕਿੰਗ ਡਿਵੈਲਪਰ ਤਕਨੀਕੀ ਬਲੂਪ੍ਰਿੰਟ
**ਤਕਨੀਕੀ ਆਰਕੀਟੈਕਚਰ ਅਤੇ ਡਾਟਾਬੇਸ ਸਕੀਮਾ**

---

## 1. ਟੈਕਨਾਲੋਜੀ ਸਟੈਕ
- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Mobile App**: Expo React Native
- **Payment**: Cashfree Split Gateway
- **Logistics**: Shiprocket REST API
"""),

    "07_Developer_Execution_Blueprint_Punjabi": ("Punjabi", """# FarmsKing E-Commerce Developer Execution Blueprint
**ਡਿਵੈਲਪਰ ਤਕਨੀਕੀ ਬਲੂਪ੍ਰਿੰਟ ਅਤੇ ਡਾਟਾਬੇਸ ਸਕੀਮਾ**

---

## 1. Core Architecture / ਆਰਕੀਟੈਕਚਰ
FarmsKing ਈ-ਕੋਮਰਸ ਮੋਡਿਊਲ ਵਿੱਚ ਹੇਠ ਲਿਖੇ ਮੁੱਖ ਘਟਕ ਸ਼ਾਮਲ ਹਨ:
* **Backend**: NestJS (Node.js) with Prisma ORM & PostgreSQL
* **Frontend**: React Native (Expo) for Mobile App & Web
* **Payment**: Cashfree Payments SDK + Split Payout APIs
* **Logistics**: Shiprocket REST API

---

## 2. Key Database Models (Prisma Schema Reference)
```prisma
model SellerStore {
  id             String        @id @default(uuid())
  businessName   String
  gstin          String        @unique
  panNumber      String
  bankAccountNo  String
  ifscCode       String
  isVerified     Boolean       @default(false)
  products       Product[]
  payouts        SellerPayout[]
  createdAt      DateTime      @default(now())
}

model SellerPayout {
  id             String      @id @default(uuid())
  storeId        String
  store          SellerStore @relation(fields: [storeId], references: [id])
  grossAmount    Float
  platformFee    Float       // 10%
  gstTcsAmount   Float       // 1%
  shippingDeduction Float    // 50% share if Free Delivery
  netPayout      Float
  status         String      // PENDING, PAID, HELD
  createdAt      DateTime    @default(now())
}
```
""")
}

def generate_all_pdfs():
    folder = "d:/FarmsKing/docs/ecommerce"
    os.makedirs(folder, exist_ok=True)

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    print(f"Starting Multilingual PDF Generation for {len(DOCUMENTS)} documents...")

    for doc_key, (lang, md_content) in DOCUMENTS.items():
        md_path = os.path.join(folder, f"{doc_key}.md")
        html_path = os.path.join(folder, f"{doc_key}.html")
        pdf_path = os.path.join(folder, f"{doc_key}.pdf")

        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
            print(f"[EXISTS] Skipping already generated PDF: {doc_key}.pdf")
            continue

        # 1. Write MD File
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)

        # 2. Render HTML
        html_content = md_to_html(md_content, doc_key.replace('_', ' '), lang)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        # 3. Print PDF via Edge Headless
        cmd = [
            edge_exe,
            "--headless",
            "--disable-gpu",
            f"--print-to-pdf={pdf_path}",
            html_path
        ]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
            if os.path.exists(pdf_path):
                print(f"[SUCCESS] Generated PDF: {doc_key}.pdf")
            else:
                print(f"[FAILED] Could not create PDF: {doc_key}.pdf")
        except Exception as e:
            print(f"[ERROR] PDF Generation Exception for {doc_key}: {e}")

if __name__ == "__main__":
    generate_all_pdfs()
