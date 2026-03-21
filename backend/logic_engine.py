"""
AgriAssist Logic Engine
========================
Pure calculation functions for: dosage, mixing, soil score, cost.
All DB functions accept a SQLAlchemy Session (FastAPI DI pattern).
All functions return directly — no AI injection needed.
"""

import re
from sqlalchemy.orm import Session
from sqlalchemy import or_
import models

# ─────────────────────────────────────────────
# ENTITY EXTRACTOR
# ─────────────────────────────────────────────

def extract_entities(message: str) -> dict:
    """
    Extract crop, fertilizer, area, NPK values and pH from a user message.
    Simple regex-based version (can be upgraded with NLP later).

    Returns a dict with keys:
      crop, fertilizer, area, n, p, k, ph, quantity
    """
    msg = message.lower()

    # --- Area: "2 acres", "1.5 acre"
    area_match = re.search(r'(\d+(\.\d+)?)\s*acres?', msg)
    area = float(area_match.group(1)) if area_match else 1.0

    # --- Quantity: "10 kg", "5 bags"
    qty_match = re.search(r'(\d+(\.\d+)?)\s*(kg|bags?|litre|liter|ml)', msg)
    quantity = float(qty_match.group(1)) if qty_match else 1.0

    # --- NPK: "N=60", "n 60", "nitrogen 60"
    n_match = re.search(r'n[=:\s]+(\d+(\.\d+)?)', msg)
    p_match = re.search(r'p[=:\s]+(\d+(\.\d+)?)', msg)
    k_match = re.search(r'k[=:\s]+(\d+(\.\d+)?)', msg)
    n = float(n_match.group(1)) if n_match else None
    p = float(p_match.group(1)) if p_match else None
    k = float(k_match.group(1)) if k_match else None

    # --- pH: "ph=6.5", "pH 7"
    ph_match = re.search(r'ph[=:\s]+(\d+(\.\d+)?)', msg)
    ph = float(ph_match.group(1)) if ph_match else None

    # --- Fertilizer keywords (common ones)
    known_fertilizers = [
        "urea", "dap", "mop", "potash", "npk", "ssp", "calcium",
        "ammonium sulphate", "zinc sulphate", "boron", "compost",
        "vermicompost", "organic", "neem cake"
    ]
    found_ferts = [f for f in known_fertilizers if f in msg]
    fertilizer = found_ferts[0] if len(found_ferts) > 0 else "urea"
    fertilizer2 = found_ferts[1] if len(found_ferts) > 1 else None

    # --- Crop keywords (common ones)
    known_crops = [
        "wheat", "rice", "maize", "corn", "cotton", "sugarcane",
        "soybean", "groundnut", "tomato", "potato", "onion",
        "chilli", "banana", "mango", "paddy", "bajra", "jowar"
    ]
    crop = next((c for c in known_crops if c in msg), "wheat")

    return {
        "crop": crop,
        "fertilizer": fertilizer,
        "fertilizer2": fertilizer2,
        "area": area,
        "quantity": quantity,
        "n": n,
        "p": p,
        "k": k,
        "ph": ph,
        "message": message,
    }


# ─────────────────────────────────────────────
# 1. DOSAGE CALCULATOR
# ─────────────────────────────────────────────

def calculate_dosage(db: Session, crop: str, fertilizer: str, area: float) -> str:
    """
    Look up fertilizer dosage for a given crop and return the
    recommended total quantity for the specified area (in acres).
    Falls back to general agronomic guideline if no DB record found.
    """
    crop = crop.lower().strip() if crop else "wheat"
    fertilizer = fertilizer.lower().strip() if fertilizer else "urea"

    record = (
        db.query(models.FertilizerDosage)
        .filter(
            models.FertilizerDosage.crop.ilike(f"%{crop}%"),
            models.FertilizerDosage.fertilizer.ilike(f"%{fertilizer}%")
        )
        .first()
    )

    if not record:
        # Smart fallback — general agronomy defaults
        defaults = {
            "urea":    (45, 50, "kg"),
            "dap":     (50, 60, "kg"),
            "mop":     (30, 40, "kg"),
            "npk":     (40, 50, "kg"),
            "ssp":     (50, 60, "kg"),
            "potash":  (30, 40, "kg"),
        }
        fert_key = fertilizer.lower() if fertilizer else ""
        lo, hi, unit = defaults.get(fert_key, (40, 50, "kg"))
        total_lo = lo * area
        total_hi = hi * area
        return (
            f"📋 No exact data found for {fertilizer} on {crop}. "
            f"Based on general recommendation, use **{total_lo:.0f}–{total_hi:.0f} {unit}** "
            f"for {area} acre(s)."
        )

    avg_dose = (float(record.min_dose) + float(record.max_dose)) / 2
    total = avg_dose * area
    return (
        f"Recommended dosage of {record.fertilizer} for {crop}: "
        f"{total:.1f} {record.unit} for {area} acre(s). "
        f"(Range: {float(record.min_dose) * area:.0f}-{float(record.max_dose) * area:.0f} {record.unit})"
    )


# ─────────────────────────────────────────────
# 2. MIXING / COMPATIBILITY CHECKER
# ─────────────────────────────────────────────

def check_mixing(db: Session, f1: str, f2: str) -> str:
    """
    Check if two fertilizers can be safely mixed.
    Falls back to a safe general advisory if no DB record found.
    """
    if not f1 or not f2:
        return (
            "⚠️ Please mention both fertilizers, e.g. 'can I mix urea and DAP?'"
        )

    result = (
        db.query(models.FertilizerCompatibility)
        .filter(
            or_(
                (
                    models.FertilizerCompatibility.fertilizer_1.ilike(f"%{f1}%") &
                    models.FertilizerCompatibility.fertilizer_2.ilike(f"%{f2}%")
                ),
                (
                    models.FertilizerCompatibility.fertilizer_1.ilike(f"%{f2}%") &
                    models.FertilizerCompatibility.fertilizer_2.ilike(f"%{f1}%")
                ),
            )
        )
        .first()
    )

    if not result:
        # Smart fallback — known dangerous pairs
        dangerous_pairs = [
            {"urea", "calcium ammonium nitrate"},
            {"urea", "chalk"},
            {"dap", "lime"},
            {"potash", "calcium nitrate"},
        ]
        pair = {f1.lower(), f2.lower()}
        is_dangerous = any(pair == p for p in dangerous_pairs)
        if is_dangerous:
            return (
                f"No database record was found, but general farming guidelines strongly suggest "
                f"that {f1} and {f2} should NOT be mixed safely. Please consult your agro-dealer."
            )
        return (
            f"There is no specific compatibility data for {f1} + {f2} in our database. "
            f"Generally, you should avoid mixing fertilizers without testing "
            f"or consulting your local agriculture expert."
        )

    if result.compatible:
        return f"Yes, you can safely mix {f1} and {f2} together."
    else:
        warning = result.warning or "It could cause chemical reactions or nutrient lockup."
        return f"It is NOT recommended to mix {f1} and {f2}. {warning}"


# ─────────────────────────────────────────────
# 3. SOIL HEALTH SCORE
# ─────────────────────────────────────────────

def calculate_soil_score(n, p, k, ph) -> str:
    """
    Calculate a soil health score (0–100) from NPK values and pH.
    Pure math — no DB needed.
    """
    if any(v is None for v in [n, p, k, ph]):
        return (
            "⚠️ Please provide all values: N (nitrogen), P (phosphorus), "
            "K (potassium), and pH. Example: 'N=60 P=45 K=50 pH=6.5'"
        )

    score = 0
    breakdown = []

    # pH (ideal 6.0 – 7.5)
    if 6.0 <= ph <= 7.5:
        score += 30
        breakdown.append("[+] pH is ideal (+30)")
    elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.0:
        score += 15
        breakdown.append("[!] pH is acceptable but not ideal (+15)")
    else:
        breakdown.append("[-] pH is out of range (+0)")

    # Nitrogen (ideal > 50 kg/ha)
    if n > 50:
        score += 25
        breakdown.append("[+] Nitrogen is sufficient (+25)")
    elif n > 25:
        score += 12
        breakdown.append("[!] Nitrogen is low (+12)")
    else:
        breakdown.append("[-] Nitrogen is deficient (+0)")

    # Phosphorus (ideal > 40 kg/ha)
    if p > 40:
        score += 25
        breakdown.append("[+] Phosphorus is sufficient (+25)")
    elif p > 20:
        score += 12
        breakdown.append("[!] Phosphorus is low (+12)")
    else:
        breakdown.append("[-] Phosphorus is deficient (+0)")

    # Potassium (ideal > 40 kg/ha)
    if k > 40:
        score += 20
        breakdown.append("[+] Potassium is sufficient (+20)")
    elif k > 20:
        score += 10
        breakdown.append("[!] Potassium is low (+10)")
    else:
        breakdown.append("[-] Potassium is deficient (+0)")

    # Rating label
    if score >= 80:
        rating = "Excellent"
    elif score >= 60:
        rating = "Good"
    elif score >= 40:
        rating = "Fair - needs attention"
    else:
        rating = "Poor - urgent remediation needed"

    breakdown_text = "\n".join([f"• {b.replace('[+]', '').replace('[!]', '').replace('[-]', '').strip()}" for b in breakdown])
    
    result = f"Your soil health is {rating.lower()} (Score: {score}/100).\n\n"
    result += breakdown_text
    result += f"\n\nOverall, your soil condition is {rating.lower()}. You should adjust your fertilization accordingly."
    return result


# ─────────────────────────────────────────────
# 4. COST ESTIMATOR
# ─────────────────────────────────────────────

def estimate_cost(db: Session, fertilizer: str, quantity: float) -> str:
    """
    Estimate cost of a fertilizer/product using the products table.
    Falls back to known market rates if product not in DB.
    """
    if not fertilizer:
        return "Please mention the fertilizer name, for example 'cost of DAP 10 kg'."

    product = (
        db.query(models.Product)
        .filter(models.Product.product_name.ilike(f"%{fertilizer}%"))
        .first()
    )

    if not product:
        # Smart fallback — approximate market rates (₹ per kg / unit)
        market_rates = {
            "urea":    14,
            "dap":     135,
            "mop":     55,
            "potash":  55,
            "npk":     75,
            "ssp":     12,
        }
        rate = market_rates.get(fertilizer.lower())
        if rate:
            total = rate * quantity
            qty_fmt = int(quantity) if quantity.is_integer() else quantity
            return (
                f"{fertilizer.capitalize()} currently costs around ₹{rate} per kg. "
                f"For {qty_fmt} kg, it will be approximately ₹{total:.0f}. "
                f"Prices may vary slightly depending on your local market. "
                f"You can check nearby fertilizer shops or government centers for the exact rate."
            )
        return (
            f"Price for {fertilizer.lower()} is currently not available in my system. "
            f"Please check with your local agro-dealer for exact rates."
        )

    total = float(product.price) * quantity
    qty_fmt = int(quantity) if quantity.is_integer() else quantity
    return (
        f"The exact shop price for {product.product_name} is ₹{float(product.price):.2f} per unit. "
        f"For {qty_fmt} units, it will cost exactly ₹{total:.2f}. "
        f"You can purchase this directly from our registered store."
    )
