import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    primary_color = RGBColor(21, 128, 61)   # #15803D Forest Green
    dark_text = RGBColor(15, 23, 42)        # #0F172A Slate 900
    sub_color = RGBColor(71, 85, 105)       # #475569 Slate 600
    gold_color = RGBColor(180, 83, 9)       # Amber 700

    # Document Header / Banner Box
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("FARMSKING TECHNOLOGIES PRIVATE LIMITED\n")
    title_run.font.name = "Calibri"
    title_run.font.size = Pt(22)
    title_run.font.bold = True
    title_run.font.color.rgb = primary_color

    sub_run = title_p.add_run("Charter of Incorporation & Statutory Legal Dossier for CA / CS\n(Prepared for Ministry of Corporate Affairs - MCA SPICe+ Portal Filing under Companies Act, 2013)")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(11)
    sub_run.font.color.rgb = sub_color

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Executive Summary Box
    callout_tbl = doc.add_table(rows=1, cols=1)
    callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    callout_cell = callout_tbl.cell(0, 0)
    set_cell_background(callout_cell, "F0FDF4") # Light Green tint
    set_cell_margins(callout_cell, top=140, bottom=140, left=200, right=200)

    cp = callout_cell.paragraphs[0]
    cp_run1 = cp.add_run("📌 ਕੰਪਨੀ ਦਾ ਮੁੱਖ ਮੰਤਵ ਅਤੇ ਸੀਏ (CA) ਲਈ ਸੰਖੇਪ ਸਾਰ:\n")
    cp_run1.font.name = "Calibri"
    cp_run1.font.bold = True
    cp_run1.font.size = Pt(11)
    cp_run1.font.color.rgb = primary_color

    cp_run2 = cp.add_run(
        "ਇਹ ਕਾਨੂੰਨੀ ਦਸਤਾਵੇਜ਼ 'FARMSKING TECHNOLOGIES PRIVATE LIMITED' ਦੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਲਈ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਹੈ। "
        "ਇਸ ਵਿੱਚ ਪ੍ਰੋਜੈਕਟ ਅਨੁਸਾਰ: (1) ਡਿਜੀਟਲ ਫਾਰਮਿੰਗ (Digital Farming & Precision Agri-Tech), "
        "(2) ਕਿਸਾਨ ਸਿੱਖਿਆ ਅਤੇ ਹੁਨਰ ਵਿਕਾਸ (Education, Training & Skilling), "
        "(3) ਲੋਕ ਭਲਾਈ ਅਤੇ ਪੇਂਡੂ ਵਿਕਾਸ (Social Welfare, Farmer Protection & Lok Bhalai), ਅਤੇ "
        "(4) ਖੇਤੀਬਾੜੀ ਅਤੇ ਗਾਰਡਨਿੰਗ ਈ-ਕਾਮਰਸ (Agri E-Commerce) ਦੇ ਸਾਰੇ ਮੈਮੋਰੈਂਡਮ ਆਫ ਐਸੋਸੀਏਸ਼ਨ (MoA) ਮੇਨ ਆਬਜੈਕਟਸ, "
        "AoA ਨਿਯਮ, NIC ਕੋਡ, DIR-2, INC-9 ਅਤੇ ਰਜਿਸਟਰਡ ਆਫਿਸ NOC ਸ਼ਾਮਲ ਹਨ।"
    )
    cp_run2.font.name = "Calibri"
    cp_run2.font.size = Pt(10)
    cp_run2.font.color.rgb = dark_text

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 1: NAME & NIC CODES
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("1. COMPANY NAME & INDUSTRIAL CLASSIFICATION (NIC CODES)")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    p = doc.add_paragraph()
    r = p.add_run("Proposed Company Names (In Order of Preference for MCA RUN / SPICe+ Part A):")
    r.font.bold = True
    
    names = [
        "1. FARMSKING TECHNOLOGIES PRIVATE LIMITED (First Preference / ਮੁੱਖ ਪਸੰਦ)",
        "2. FARMSKING TECHNOLOGIES PRIVATE LIMITED (Second Preference / ਦੂਜੀ ਪਸੰਦ)",
        "3. FARMSKING AGRI SOLUTIONS PRIVATE LIMITED (Third Preference)",
        "4. FARMSKING DIGITAL AGRO PRIVATE LIMITED (Fourth Preference)"
    ]
    for nm in names:
        p_nm = doc.add_paragraph(nm, style='List Bullet')
        p_nm.paragraph_format.space_after = Pt(2)

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(6)
    p_sig.add_run("Significance of Name: ").font.bold = True
    p_sig.add_run(
        "The name 'FARMSKING' combines 'FARMS' (representing agricultural ecosystems, sustainable farming, horticulture, and rural prosperity) "
        "and 'KING' (symbolizing market leadership, premium quality, self-reliance, and empowerment of farmers). "
        "The company operates state-of-the-art digital farming software, educational academies, welfare initiatives, and input distribution across India."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Table of NIC Codes
    nic_tbl = doc.add_table(rows=6, cols=3)
    nic_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    nic_headers = ["NIC 2008 Code", "Activity Description", "Scope / Purpose in FarmsKing"]
    for i, h in enumerate(nic_headers):
        c = nic_tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 150, 150)
        p = c.paragraphs[0]
        run = p.add_run(h)
        run.font.name = "Calibri"
        run.font.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(255, 255, 255)

    nic_data = [
        ("62013 / 62099", "Providing software support, maintenance, web portals, mobile application development, data analytics", "Primary Activity: Agri-Tech SaaS, AI Crop Doctor, Mobile Apps, Cloud Telemetry"),
        ("01611 / 01619", "Support activities for agriculture, digital farm extension services, agronomic pest consultancy", "Secondary Activity: Tele-agronomy, precision farm telemetry, garden advisory"),
        ("85499", "Other education n.e.c. (Technical training, farmer skilling, digital literacy)", "Education & Skilling: Farmer bootcamps, digital literacy camps, rural youth training"),
        ("88900", "Other social work activities without accommodation (Rural farmer welfare, livelihood support)", "Lok Bhalai: Farmer distress helpdesk, anti-exploitation transparency, rural upliftment"),
        ("47912", "Retail sale via e-commerce / online marketplace (Farm inputs, seeds, bio-nutrients, tools)", "Marketplace: E-commerce platform for agri inputs, nursery plants & tools delivery")
    ]

    for row_idx, data in enumerate(nic_data, start=1):
        for col_idx, text in enumerate(data):
            c = nic_tbl.cell(row_idx, col_idx)
            if row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 120, 120)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.color.rgb = dark_text
            if col_idx == 0:
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 2: MoA CLAUSE III(A) - MAIN OBJECTS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("2. MEMORANDUM OF ASSOCIATION (MoA) — CLAUSE III(A): MAIN OBJECTS")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    p_intro = doc.add_paragraph()
    p_intro.add_run("(These 6 clauses represent the exact legal text to be entered into Form INC-33 e-MoA on the MCA portal)").font.italic = True

    main_objects = [
        (
            "1. DIGITAL FARMING, PRECISION AGRICULTURE & AGRI-TECH SAAS ECOSYSTEM",
            "To design, develop, build, host, operate, own, maintain, license, and commercialize comprehensive digital agriculture, "
            "precision farming, and horticulture technology platforms, web portals, cloud computing software, and mobile applications "
            "under the brand name 'FarmsKing' or such other brand names, equipped with artificial intelligence (AI), machine learning (ML), "
            "computer vision, internet of things (IoT), satellite remote sensing, Normalized Difference Vegetation Index (NDVI) field telemetry, "
            "drone-based aerial crop scouting, automated smart irrigation scheduling, weather forecasting intelligence, farm ledger accounting, "
            "and precision agronomy systems for farmers, growers, horticulturists, terrace and home gardeners across India and internationally."
        ),
        (
            "2. PROMOTION OF DIGITAL FARMING, AGRICULTURAL EDUCATION & SKILL DEVELOPMENT (ਕਿਸਾਨ ਸਿੱਖਿਆ ਅਤੇ ਹੁਨਰ ਵਿਕਾਸ)",
            "To actively promote, propagate, and advance modern digital farming techniques, precision agriculture, sustainable agricultural methodologies, "
            "and farm automation by establishing, conducting, and managing digital farmer training centers, agricultural literacy camps, rural skill development bootcamps, "
            "workshops, seminars, webinars, certification programs, audio-visual educational content, multi-lingual agricultural academies, mobile demonstration vans, and e-learning platforms; "
            "to train farmers, rural youth, women agriculturists, and farm workers in digital farm record keeping, smartphone-based farm management, soil fertility conservation, "
            "climate-smart agriculture, integrated pest management (IPM), micro-irrigation, and post-harvest management, thereby bridging the rural digital divide and enhancing agrarian productivity."
        ),
        (
            "3. LOK BHALAI, FARMER WELFARE & RURAL COMMUNITY EMPOWERMENT (ਕਿਸਾਨ ਅਤੇ ਪੇਂਡੂ ਲੋਕ ਭਲਾਈ ਕਾਰਜ)",
            "To conceptualize, organize, implement, support, and administer public welfare, social upliftment, and community benefit programs ('Lok Bhalai') aimed at the holistic welfare, "
            "economic stability, and social security of small, marginal, and progressive farmers, tenant farmers, and rural farming communities; to set up farmer distress helplines, "
            "suicide prevention advisory desks, fair-price awareness campaigns, debt-management financial education, soil and groundwater conservation drives, organic and natural farming adoption drives; "
            "to facilitate capacity building, technical empowerment, and collective bargaining for Farmer Producer Organizations (FPOs), Self-Help Groups (SHGs), and primary agricultural cooperatives; "
            "to promote fair, transparent market practices preventing agrarian exploitation by middlemen; and to undertake corporate social responsibility (CSR), rural livelihood enhancements, "
            "and environmental stewardship projects for national agrarian prosperity."
        ),
        (
            "4. AGRI & HORTICULTURE E-COMMERCE MARKETPLACE & DIRECT MARKET LINKAGES",
            "To establish, operate, manage, and facilitate an omnichannel electronic marketplace, e-commerce platform, direct-to-consumer (D2C), business-to-business (B2B), "
            "and business-to-consumer (B2C) digital supply chain network for buying, selling, marketing, importing, exporting, distributing, warehousing, delivering, "
            "and facilitating transaction of agricultural inputs, certified hybrid and indigenous seeds, organic fertilizers, bio-nutrients, bio-pesticides, micronutrients, "
            "drip and sprinkler irrigation machinery, farm implements, pruning tools, nursery plants, indoor/outdoor plants, potting media, terrace garden accessories, "
            "and post-harvest agricultural commodities; and to facilitate direct farm-to-fork and farm-to-market channels providing remunerative prices directly to farmers."
        ),
        (
            "5. TELE-ADVISORY, CROP DOCTOR & HORTICULTURE EXPERT CONSULTATION NETWORK",
            "To establish, maintain, and operate interactive digital consultation platforms, tele-agronomy clinics, and digital diagnostic centers connecting registered farmers, "
            "kitchen gardeners, and orchard owners with qualified agricultural scientists, certified agronomists, horticulturists, plant pathologists, entomologists, and garden advisors; "
            "to provide automated and expert-verified diagnosis of crop and plant diseases, nutrient deficiencies, pest infestations, and physiological disorders; "
            "and to prescribe scientifically recommended organic, biological, and chemical remedial measures via Punjabi, Hindi, English, and regional language voice and chat interfaces."
        ),
        (
            "6. REAL-TIME MANDI PRICE INTELLIGENCE, CROP ANALYTICS & FINANCIAL RECORD MANAGEMENT",
            "To collect, aggregate, process, verify, analyze, and disseminate real-time daily agricultural and horticultural market rates, mandi arrivals, Minimum Support Prices (MSP), "
            "future price trends, and demand-supply analytics from government mandis, APMCs, and private markets across India; to provide automated crop economics calculators, "
            "commission and interest computation engines for commission agents (arhtiyas), digital receipts, input cost vs. yield profitability tracking, and digital financial management tools "
            "enabling farming families to maintain accountable, profitable, and bankable farm balance sheets."
        )
    ]

    for title, clause_text in main_objects:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(8)
        p_t.paragraph_format.space_after = Pt(2)
        r_t = p_t.add_run(title)
        r_t.font.name = "Calibri"
        r_t.font.bold = True
        r_t.font.size = Pt(11)
        r_t.font.color.rgb = dark_text

        # Quote / Indented paragraph
        p_c = doc.add_paragraph()
        p_c.paragraph_format.left_indent = Inches(0.25)
        p_c.paragraph_format.right_indent = Inches(0.25)
        p_c.paragraph_format.space_after = Pt(6)
        r_c = p_c.add_run(f'"{clause_text}"')
        r_c.font.name = "Calibri"
        r_c.font.size = Pt(10)
        r_c.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 3: MoA CLAUSE III(B) - INCIDENTAL & ANCILLARY OBJECTS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("3. MoA CLAUSE III(B): INCIDENTAL & ANCILLARY OBJECTS (17 STATUTORY POWERS)")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    incidental_objects = [
        ("1. Research & Intellectual Property:", "To conduct scientific research, data science research, agronomic modeling, and apply for, purchase, register, maintain, license, and defend patents, copyrights, trademarks, software algorithms, trade secrets, and proprietary AI models relating to agriculture and education."),
        ("2. Educational & Government Collaborations:", "To collaborate, partner, enter into MoUs, and work jointly with State Agricultural Universities (such as PAU Ludhiana, ICAR institutes), Krishi Vigyan Kendras (KVKs), Ministry of Agriculture, NABARD, State Horticulture Missions, and educational boards to deliver farmer training and welfare projects."),
        ("3. Software & Cloud Infrastructure:", "To acquire, build, lease, install, maintain, and operate cloud servers, cyber-security firewalls, satellite data downlink APIs, SMS/WhatsApp messaging gateways, payment gateways, and machine learning compute clusters necessary for the smooth operation of digital platforms."),
        ("4. Rural Hubs & Agri-Clinics:", "To construct, acquire, take on lease, establish, and run rural digital kiosks, demonstration farms, soil testing laboratories, plant health clinics, farmer facilitation hubs, warehouses, cold storage centers, and fulfillment hubs."),
        ("5. Financial Facilities & Banking Operations:", "To open, operate, maintain, and close bank accounts (current, savings, overdraft, escrow), draw, accept, endorse, discount, and issue cheques, bills of exchange, and negotiable instruments necessary for business operations."),
        ("6. Borrowing & Capital Raising:", "To raise loans, working capital facilities, project finance, venture capital, seed capital, or credit facilities from banks, NBFCs, financial institutions, or investors against security of company assets or without security."),
        ("7. Government Schemes & Subsidies Facilitation:", "To assist farmers, farmer groups, and the company in accessing, applying for, and implementing beneficial government welfare schemes including PM-KISAN, PMKSY, SMAM, Agri Infrastructure Fund (AIF), and crop insurance schemes (PMFBY)."),
        ("8. Corporate Social Responsibility (CSR) & Charitable Endowments:", "To establish, fund, support, or sponsor charitable trusts, non-profit societies, foundations, environmental conservation funds, clean-water projects, farmer relief funds, and educational scholarships for rural students."),
        ("9. Logistics & Fleet Management:", "To purchase, lease, hire, maintain, or contract logistics vehicles, electric delivery vans, agricultural drones, spraying equipment, and delivery mechanisms for last-mile delivery of farm inputs and pickup of produce."),
        ("10. Agency, Franchise & Distributorship:", "To act as agents, distributors, stockists, representatives, brokers, commission agents, franchisors, or franchisees for seed breeders, fertilizer manufacturers, farm tool creators, and agricultural implement producers."),
        ("11. Technical Staff & Expert Retention:", "To employ, retain, train, and compensate agronomists, software engineers, data scientists, soil chemists, extension officers, customer support advisors, legal counsels, and field coordinators."),
        ("12. Acquisitions & Joint Ventures:", "To acquire, take over, amalgamate with, enter into joint ventures, or merge with any firm, trust, society, or company possessing business objects similar or complementary to those of this company."),
        ("13. Import & Export:", "To import, export, buy, sell, exchange, or distribute modern agricultural machinery, specialized sensors, organic inputs, seeds, horticultural plant saplings, laboratory reagents, and software tools from and to any part of the world."),
        ("14. Publications & Media Dissemination:", "To print, publish, broadcast, podcast, stream, and distribute agricultural journals, farming magazines, educational booklets, informative audio/video podcasts, and digital newsletters dedicated to progressive agriculture."),
        ("15. Loyalty & Reward Programs:", "To institute loyalty point systems, discount coupons, cashback vouchers, and reward mechanisms for progressive farmers, active advisors, and community champions to promote engagement."),
        ("16. Disaster Relief & Emergency Response:", "To organize, sponsor, and mobilize emergency assistance, crop salvage advisories, pest outbreak management drives, and humanitarian supplies during natural calamities, floods, droughts, and agricultural distress situations."),
        ("17. General Incidental Powers:", "To do all such other acts, deeds, and things as are incidental or conducive to the attainment of the above main objects and the general advancement of digital agriculture, farmer education, and public welfare in India.")
    ]

    for title, desc in incidental_objects:
        p_inc = doc.add_paragraph()
        p_inc.paragraph_format.space_before = Pt(3)
        p_inc.paragraph_format.space_after = Pt(3)
        p_inc.paragraph_format.left_indent = Inches(0.2)
        r_t = p_inc.add_run(f"{title} ")
        r_t.font.name = "Calibri"
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_inc.add_run(desc)
        r_d.font.name = "Calibri"
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 4: ARTICLES OF ASSOCIATION (AoA) - FORM INC-34
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("4. ARTICLES OF ASSOCIATION (AoA) — KEY GOVERNANCE CLAUSES")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    aoa_points = [
        ("4.1 Adoption of Table F:", "The company adopts Table F of Schedule I to the Companies Act, 2013, subject to the specific governance and shareholding safeguards detailed herein."),
        ("4.2 Private Limited Restrictions (Section 2(68)):", "The right to transfer shares is restricted; the total number of members is limited to 200; and any invitation to the public to subscribe for securities is strictly prohibited."),
        ("4.3 Right of First Refusal (ROFR - ਸ਼ੇਅਰ ਟਰਾਂਸਫਰ ਦੀ ਪਹਿਲੀ ਪੇਸ਼ਕਸ਼):", "No shareholder may sell, transfer, pledge, or alienate shares to any third party without first offering the identical shares to the Primary Founder / Majority Shareholder (Surinder Singh) at fair valuation. Founder has 30 days right of pre-emption."),
        ("4.4 Board Composition & Supreme Control:", "Minimum 2 Directors, maximum 15 Directors. The Primary Founder holding 80% equity retains supreme veto voting authority over special resolutions, director appointment/removal, capital increase, and asset disposal."),
        ("4.5 Electronic Meetings & Digital Voting:", "Board and shareholder meetings can be held physically or via audio-visual electronic facilities (video conferencing) compliant with Section 173(2) of the Act, with digitally recorded minutes.")
    ]

    for title, desc in aoa_points:
        p_aoa = doc.add_paragraph()
        p_aoa.paragraph_format.space_before = Pt(4)
        p_aoa.paragraph_format.space_after = Pt(4)
        p_aoa.paragraph_format.left_indent = Inches(0.2)
        r_t = p_aoa.add_run(f"{title} ")
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_aoa.add_run(desc)
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 5: CAPITAL STRUCTURE & SHAREHOLDING ROSTER
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("5. CAPITAL STRUCTURE & PROPOSED SHAREHOLDING ROSTER")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    cap_tbl = doc.add_table(rows=4, cols=5)
    cap_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cap_headers = ["Member Name", "Designation", "Proposed Shares", "Equity %", "Legal / Operational Status"]
    for i, h in enumerate(cap_headers):
        c = cap_tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        run = p.add_run(h)
        run.font.name = "Calibri"
        run.font.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    members_data = [
        ("Surinder Singh", "Founder & Subscriber", "800 Shares", "80.00%", "Lead Founder & Primary Subscriber"),
        ("Gagandeep Kaur", "Director & Subscriber", "100 Shares", "10.00%", "First Director & Subscriber (DIN & DSC Holder)"),
        ("Bakshish Singh", "Director & Subscriber", "100 Shares", "10.00%", "First Director & Subscriber (DIN & DSC Holder)")
    ]

    for row_idx, data in enumerate(members_data, start=1):
        for col_idx, text in enumerate(data):
            c = cap_tbl.cell(row_idx, col_idx)
            if row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = "Calibri"
            run.font.size = Pt(9)
            run.font.color.rgb = dark_text
            if col_idx == 0:
                run.font.bold = True
            if col_idx == 3:
                run.font.bold = True
                run.font.color.rgb = primary_color

    p_cap_note = doc.add_paragraph()
    p_cap_note.paragraph_format.space_before = Pt(6)
    p_cap_note.add_run("Authorized Capital: ").font.bold = True
    p_cap_note.add_run("₹ 1,00,000 (10,000 Equity Shares of ₹ 10 each)  |  ")
    p_cap_note.add_run("Paid-up Capital: ").font.bold = True
    p_cap_note.add_run("₹ 10,000 (1,000 Equity Shares of ₹ 10 each)")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 6: STATUTORY FORMS & DRAFT AFFIDAVITS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("6. STATUTORY TEMPLATES: DIR-2, INC-9 & REGISTERED OFFICE NOC")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    # 6.1 FORM DIR-2
    h2 = doc.add_heading(level=2)
    h2_run = h2.add_run("6.1 FORM DIR-2 (Consent to act as Director — Section 152(5))")
    h2_run.font.name = "Calibri"
    h2_run.font.color.rgb = dark_text
    h2_run.font.size = Pt(12)
    h2_run.font.bold = True

    dir2_text = (
        "To,\n"
        "The Board of Directors / Promoters,\n"
        "FARMSKING TECHNOLOGIES PRIVATE LIMITED\n"
        "[Proposed Registered Office Address: ____________________________________]\n\n"
        "Subject: Consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED\n\n"
        "I, [Director Name], son/daughter/wife of [Father's Name], resident of [Residential Address], hereby give my consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.\n\n"
        "1. Director Identification Number (DIN): [If already allotted, else Applied in SPICe+]\n"
        "2. Full Name: [Full Name as on PAN Card]\n"
        "3. Father's Name: [Father's Name]\n"
        "4. Address: [Permanent / Present Address]\n"
        "5. E-mail ID: [Email Address] | Mobile: [Mobile Number]\n"
        "6. PAN Number: [PAN Number] | Date of Birth: [DD/MM/YYYY] | Nationality: Indian\n\n"
        "Declaration:\n"
        "I declare that I have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP and have not been found guilty of any fraud or misfeasance or breach of duty in the last five years. If chosen as Director, I will not contravene any provisions of the Act.\n\n"
        "Date: _______________          Place: Punjab, India          Signature: __________________________\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(dir2_text)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    # 6.2 FORM INC-9
    h2 = doc.add_heading(level=2)
    h2_run = h2.add_run("6.2 FORM INC-9 (Declaration by Subscribers & First Directors — Section 7(1)(c))")
    h2_run.font.name = "Calibri"
    h2_run.font.color.rgb = dark_text
    h2_run.font.size = Pt(12)
    h2_run.font.bold = True

    inc9_text = (
        "MEMORANDUM OF DECLARATION\n\n"
        "I, [Name of Subscriber / Director], residing at [Address], do hereby solemnly declare and state as follows:\n\n"
        "1. That I have not been convicted of any offence in connection with the promotion, formation, or management of any company;\n"
        "2. That I have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under the Companies Act, 2013 or any previous company law during the preceding five years;\n"
        "3. That all documents filed with the Registrar for registration of FARMSKING TECHNOLOGIES PRIVATE LIMITED contain information that is correct, complete, and true to the best of my knowledge and belief;\n"
        "4. That the company shall carry out genuine and lawful activities in accordance with the Main Objects of the MoA, including digital farming development, farmer education & skilling, community welfare (Lok Bhalai), and agri e-commerce services.\n\n"
        "Verified at Punjab on this _____ day of ____________ 2026.\n\n"
        "Deponent Signature: __________________________     Name: [Subscriber/Director Name]     PAN: [PAN Number]\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(inc9_text)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    # 6.3 NOC FOR REGISTERED OFFICE
    h2 = doc.add_heading(level=2)
    h2_run = h2.add_run("6.3 NO OBJECTION CERTIFICATE (NOC) FOR REGISTERED OFFICE")
    h2_run.font.name = "Calibri"
    h2_run.font.color.rgb = dark_text
    h2_run.font.size = Pt(12)
    h2_run.font.bold = True

    noc_text = (
        "NO OBJECTION CERTIFICATE (NOC)\n"
        "(To whomsoever it may concern)\n\n"
        "I, [Name of Property Owner], S/o [Father's Name], resident of [Owner's Address], do hereby solemnly affirm and state as under:\n\n"
        "1. That I am the absolute legal owner and in lawful possession of the premises situated at:\n"
        "   [Full Address of Registered Office with Pin Code, District, Punjab, India].\n\n"
        "2. That I have NO OBJECTION whatsoever if the proposed company named \"FARMSKING TECHNOLOGIES PRIVATE LIMITED\" (or any other name approved by the MCA) uses the aforesaid premises as its REGISTERED OFFICE for the purpose of carrying on its corporate, administrative, digital platform, training, and commercial operations and for maintaining its statutory books and records under the Companies Act, 2013.\n\n"
        "3. That I have no objection to the said company obtaining GSTIN, MSME, Professional Tax, Startup India recognition, and opening bank accounts using this address.\n\n"
        "Attached herewith:\n"
        "- Copy of Electricity Bill / Utility Bill (not older than 2 months)\n"
        "- Copy of Owner's PAN & Aadhaar Card as proof of identity and title.\n\n"
        "Date: _______________     Place: Punjab, India     Signature of Owner: __________________________ (Name & Mobile)\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(noc_text)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 7: CHECKLIST & CA INSTRUCTIONS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("7. CHECKLIST & STEP-BY-STEP INSTRUCTIONS FOR CA / INDIAFILINGS")
    h1_run.font.name = "Calibri"
    h1_run.font.color.rgb = primary_color
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True

    steps = [
        ("Step 1: Name Reservation (SPICe+ Part A)", "Apply for 'FARMSKING TECHNOLOGIES PRIVATE LIMITED' with NIC code 62013 and attach the Name Significance paragraph from Section 1."),
        ("Step 2: Digital Signatures (DSC)", "Obtain Class-3 Digital Signatures for active directors (Gagandeep Kaur, Bakshish Singh, Surinder Singh) via 1-minute mobile video KYC."),
        ("Step 3: SPICe+ Part B & e-MoA (INC-33) Filing", "Copy-paste the exact 6 Main Objects from Section 2 into e-MoA INC-33. Paste the 17 Incidental Objects into Clause III(B)."),
        ("Step 4: e-AoA (INC-34) Filing", "Adopt Table F with ROFR pre-emption rights and private limited share transfer restrictions from Section 4."),
        ("Step 5: AGILE-PRO-S Integrated Services", "Tick marks for: (a) GSTIN Registration, (b) EPFO & ESIC, (c) Profession Tax (Punjab), and (d) ICICI Bank / HDFC Bank Current Account opening."),
        ("Step 6: ROC Approval & Certificate of Incorporation (COI)", "Within 7-10 working days, ROC CRC issues Certificate of Incorporation containing CIN, PAN, and TAN numbers."),
        ("Step 7: Bank Account & Startup India DPIIT", "Company Current Account is activated; apply on startupindia.gov.in for DPIIT certificate to claim 3-year income tax exemption.")
    ]

    for title, desc in steps:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(3)
        p_st.paragraph_format.space_after = Pt(3)
        r_t = p_st.add_run(f"{title}: ")
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_st.add_run(desc)
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Footer note
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_p.add_run("👑 FARMSKING TECHNOLOGIES PRIVATE LIMITED — Empowering Farmers, Greenery & Rural India")
    footer_run.font.name = "Calibri"
    footer_run.font.size = Pt(10)
    footer_run.font.bold = True
    footer_run.font.color.rgb = primary_color

    # Save destinations
    desktop_path = r"C:\Users\hp\Desktop\farmsking.docx"
    local_path = r"d:\FarmsKing\farmsking.docx"

    doc.save(desktop_path)
    print(f"Successfully saved to Desktop: {desktop_path}")

    doc.save(local_path)
    print(f"Successfully saved to Project root: {local_path}")

if __name__ == "__main__":
    create_document()
